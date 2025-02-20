import hcloud from "hcloud-sdk";
import { DesignBuild } from "hcloud-sdk/lib/interfaces/high5/space/event/stream";
import { ExtendedHigh5ExecutionPackage, High5ExecutionPayload } from "hcloud-sdk/lib/interfaces/high5/space/execution";
import { Design } from "./definitions/application/Design";
import { EngineManager } from "./helpers/EngineManager";

const execute = async (engineVersion: string, payload: High5ExecutionPayload, design: Design) => {
    const waveEngine = await new EngineManager(engineVersion).getEngine(false);
    const executionPackage = {
        design: { nodes: [], startNode: "0" } as DesignBuild,
        payload,
        waveCatalogs: [],
        waveEngine,
        dry: false,
        hcl: new hcloud({ server: "" }),
        orgName: "TestOrganization",
        spaceName: "TestSpace",
        streamId: "7".repeat(24),
        secret: "some-secret-line",
        info: { target: "o.hryshchenko+framework@moovit-sp.com" },
    } as unknown as ExtendedHigh5ExecutionPackage;

    const { executeStream } = await import("./service/StreamService");
    return await executeStream(executionPackage, design);
};

export { execute };
