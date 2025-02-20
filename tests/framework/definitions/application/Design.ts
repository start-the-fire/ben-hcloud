import { ExtendedHigh5ExecutionPackage } from "hcloud-sdk/lib/interfaces/high5/space/execution";
import type { StreamNodeAdditionalConnector } from "../../.engine/build/models/StreamNode";
import type { StreamResult } from "engine/build/models/StreamResult";
import type Node from "engine/build/nodes/Node";
import type { NodeInputs } from "./Inputs";

declare type NodeConstructor = new (
    executionPackage: ExtendedHigh5ExecutionPackage,
    streamResult: StreamResult,
    inputs?: StreamNodeInput[],
    additionalConnectors?: StreamNodeAdditionalConnector[]
) => Node;

interface Design {
    node: NodeConstructor;
    uuid: number | string;
    inputs: NodeInputs;
    onSuccess?: Design;
}

export { Design };
