import {
    ExtendedHigh5ExecutionPackage,
    High5ExecutionPackage,
    High5ExecutionPayloadType,
} from "hcloud-sdk/lib/interfaces/high5/space/execution/index";
import type { Design } from "../definitions/application/Design";
import type { NodeData } from "../definitions/application/StreamNode";
import { resolveInputs } from "../helpers/InputHelper";
import { patchEngine } from "./PatchEngine";

const DURATION = "Run time";

const parsePayload = (executionPackage: High5ExecutionPackage) => {
    let payloadData = undefined;
    switch (executionPackage.payload.type) {
        case High5ExecutionPayloadType.JSON:
            try {
                payloadData = JSON.parse(executionPackage.payload.data);
            } catch (error: unknown) {
                console.error(`Unable to parse payload to json - ${error}`);
                return null;
            }
            console.info("Successfully parsed payload to json");
            break;
        default:
            console.info("Successfully parsed payload to plain text");
            break;
    }
    return payloadData;
};

const executeStream = async (executionPackage: ExtendedHigh5ExecutionPackage, design: Design) => {
    // parse payload
    executionPackage.payload.data = parsePayload(executionPackage);

    const execution = await import("engine/build/helpers/ExecutionStateHelper");
    const runner = await import("engine/build/utils/StreamRunner");
    const wave = await import("engine/build/helpers/Wave");
    const { StreamResult } = await import("engine/build/models/StreamResult");

    let duration: number = 0;
    const nodes: NodeData = {};
    const streamRunner = new runner.default(executionPackage as ExtendedHigh5ExecutionPackage);
    const executionStateHelper = new execution.default().init(executionPackage as ExtendedHigh5ExecutionPackage);

    while (design) {
        console.info("• Execute node:", design.node.name);
        const node = new design.node(executionPackage, StreamResult.create({}), resolveInputs(design.inputs, nodes));
        node.setExecutionStateHelper(executionStateHelper);
        const w = patchEngine(new wave.default(node, streamRunner), executionPackage.waveEngine.version);
        node.setWave(w);
        await node.run();
        nodes[String(design.uuid)] = { input: node.getInputs() || [], output: node.getOutputs() || [] };
        duration += nodes[String(design.uuid)].output.filter((out) => out.name === DURATION)[0]?.value || 0;
        node.setOutput(DURATION, duration);
        if (design?.onSuccess) {
            design = design.onSuccess;
        } else break;
    }

    return nodes[String(design.uuid)].output;
};

export { executeStream };
