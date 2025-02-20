import path from "path";
import { EngineManager } from "./EngineManager";

const initCatalog = async (engineVersion: string, catalogPath: string) => {
    await new EngineManager(engineVersion).getEngine(true);
    const catalogModule = await import(catalogPath);
    const nodeModule = await import(path.join("engine", "build", "nodes", "Node"));
    return new catalogModule.Catalog(nodeModule.default).nodeCatalog;
};

export { initCatalog as default };
