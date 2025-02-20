import crypto from "crypto";
import { existsSync, mkdirSync } from "fs";
import fs, { rm } from "fs/promises";
import hcloud from "hcloud-sdk";
import { Engine, EngineRegistry, WaveEngine } from "hcloud-sdk/lib/interfaces/high5/wave";
import path from "path";
import tar from "tar";
import { getConfig, loadConfig } from "../config/ConfigReader";
import { downloadFile } from "./DownloadHelper";

class EngineManager {
    private folderName = "engine";
    private baseEngineFolder: string;
    private version: string | undefined;

    constructor(engineVersion?: string) {
        this.version = engineVersion;
        this.baseEngineFolder = path.resolve(__dirname, "../../../node_modules/");
        this.createBaseEngineFolder();
    }

    private async createBaseEngineFolder(): Promise<void> {
        try {
            await fs.mkdir(this.baseEngineFolder, {
                recursive: true,
            });
        } catch (error) {
            console.error(`Can not create engines folder: '${String(error)}`);
            const stat = await fs.stat(this.baseEngineFolder);
            if (!stat.isDirectory())
                throw new Error(`Unable to create engine folder. A file already exists with the same path. ${this.baseEngineFolder}`);
        }
    }

    private getEnginePath(): string | null {
        const enginePath = path.join(this.baseEngineFolder, this.folderName, "build", "index.js");
        return existsSync(enginePath) ? enginePath : null;
    }

    private async downloadEngine(fileUrl: string, outputLocationPath: string, md5: string): Promise<void> {
        await downloadFile(fileUrl, outputLocationPath);
        await this.isMd5Match(md5, outputLocationPath, true);
    }

    private async unPackEngine(enginePath: string, outputLocationPath: string): Promise<string> {
        await tar.x({ file: enginePath, cwd: outputLocationPath });

        const engineFile = path.join(outputLocationPath, "build", "index.js");
        if (!existsSync(engineFile)) {
            throw new Error("Unable to find index.js");
        }
        return engineFile;
    }

    private async prepareEngine(engine: WaveEngine): Promise<string> {
        let enginePath: string | null = path.join(this.baseEngineFolder, this.folderName);
        const tarFile = path.join(enginePath, "engine.tar");
        const isExists = existsSync(tarFile);
        if ((isExists && !(await this.isMd5Match(engine.md5, tarFile, false))) || !isExists) {
            console.info("Deleting different version of the Engine...");
            try {
                await rm(enginePath, { recursive: true });
            } catch {
                /* Do nothing if path is not exist */
            }
        }
        enginePath = this.getEnginePath();
        if (!enginePath) {
            console.info(`Engine ${engine.version} not found. Downloading and unpacking...`);
            enginePath = path.join(this.baseEngineFolder, this.folderName);
            console.log(`Storing new engine at ${enginePath}`);
            mkdirSync(enginePath, { recursive: true });
            try {
                await this.downloadEngine(engine.url, tarFile, engine.md5);
            } catch (err) {
                await rm(enginePath, { recursive: true });
                throw new Error(`Failed to download Engine: ${String(err)}`);
            }
            await this.isMd5Match(engine.md5, tarFile, true);
            try {
                enginePath = await this.unPackEngine(tarFile, enginePath);
            } catch (err) {
                await rm(enginePath, { recursive: true });
                throw new Error(`Failed to unpack Engine - ${String(err)}`);
            }
            console.info("Engine successfully written");
        } else {
            console.info(`Detected previously downloaded copy of the engine ${engine.version}.`);
        }
        return enginePath;
    }

    private async isMd5Match(md5: string, filePath: string, throwError = true): Promise<boolean> {
        const content = await fs.readFile(filePath);
        if (md5 !== crypto.createHash("md5").update(content).digest("hex")) {
            if (throwError) {
                throw new Error("MD5 hash of downloaded engine does not match the expected hash");
            }
            return false;
        }
        return true;
    }

    /**
     * Download the registry of all available Wave Engines.
     */
    private async getEnginesList(): Promise<WaveEngine[]> {
        const engines: WaveEngine[] = [];
        const hcl = new hcloud({ server: "" });
        await loadConfig();
        const s3PublicWaveUrl = getConfig().s3_public_wave_url;

        let registry: EngineRegistry;
        try {
            registry = await hcl.High5.wave.s3.getEngineRegistry(s3PublicWaveUrl);
        } catch (error) {
            throw new Error(`Failed to get registry from '${s3PublicWaveUrl}': ${String(error)}`);
        }

        for (const e of registry.engines) {
            try {
                const engine: Engine = await hcl.High5.wave.s3.getEngine(e.url);
                engines.push(...engine.versions);
            } catch (error) {
                throw new Error(`Failed to get engine from '${e.url}': ${String(error)}`);
            }
        }
        return engines;
    }

    /**
     * Get specified version of Wave Engine if available
     * if the version is not specified - get the latest stable version.
     */
    async getEngine(download: boolean): Promise<WaveEngine> {
        let engine: WaveEngine | undefined;
        let engines: WaveEngine[] = await this.getEnginesList();
        if (!engines.length) throw new Error("There are no available Wave Engines");
        // in case of a version being set it is a patchEngine request and it could be a dev version
        // otherwise it's a createSpace request and we filter out dev versions
        if (!this.version) {
            engines = engines.filter((engine: WaveEngine) => !engine.dev);
            engine = engines[engines.length - 1];
        } else {
            engine = engines.find((e) => e.version === this.version);
            if (!engine)
                throw new Error(
                    `Wave Engine version ${this.version} does not exist, please try one of the following values: ${engines
                        .map((e) => e.version)
                        .sort()
                        .join(", ")}`
                );
        }
        if (download) {
            await this.prepareEngine(engine);
        }
        return engine;
    }
}

export { EngineManager };
