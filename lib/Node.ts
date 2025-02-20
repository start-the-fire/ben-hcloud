import type HCloud from "hcloud-sdk";
import type { StreamResult } from "hcloud-sdk/lib/interfaces/high5/space/event/stream";
import type { StreamNodeOutput } from "hcloud-sdk/lib/interfaces/high5/space/event/stream/node";
import type { StreamNodeSpecification, StreamNodeSpecificationInput } from "hcloud-sdk/lib/interfaces/high5/wave";
import { DuplicateFileOption } from "./enums/DuplicateFileOptionEnum";
import { DuplicateFolderOption } from "./enums/DuplicateFolderOptionEnum";
import { AxiosRequestConfig } from "axios";

export default abstract class Node {
    public static _isWaveNode = true;
    wave!: WaveHelper; // This property will be inserted at runtime don't implement it
    abstract specification: StreamNodeSpecification;
    abstract execute(): Promise<void>;
}

export type WaveHelper = {
    general: General;
    logger: Logger;
    inputs: Inputs;
    outputs: Outputs;
    fileAndFolderHelper: FileAndFolderHelper;
    axiosHelper: AxiosHelper;
};

type General = {
    /**
     * Get the nodes uuid, an unique identifier for the node
     * @returns The nodes uuid
     */
    getNodeUuid(): string;
    /**
     * Resolve an arbitrary string value on demand within the node. Keep in mind that any wildcards
     * used in node inputs are already resolved. Use {@link Wave.Inputs.getInputValueByInputName} to
     * get the resolved value of an input.
     * @param {string} value - String to be resolved
     * @returns The resolved value as number if its a string representation of a number, otherwise as string
     */
    resolveValue(value: string): number | string;
    /**
     * The function `getNodeSpecification` returns the node specification of a stream node.
     * @returns The method `getNodeSpecification()` is being called on the `node` object, and the
     * result of that method call is being returned.
     */
    getNodeSpecification(): StreamNodeSpecification;
    /**
     * The function "cancelExecution" sets the overall execution state to be "CANCELED". Make sure to stop all
     * processes the node is currently running before calling that method.
     */
    cancelExecution(): void;
    /**
     * The function "isCanceled" checks if the execution state is "CANCELED".
     * @returns `true` if the execution state is "CANCELED", otherwise `false`
     */
    isCanceled(): boolean;
    /**
     * The function "getHcloudClient" returns the HCloud coming from initial execution request.
     * It already holds the server configuration and the token of the execution target.
     * @returns The HCloud client
     */
    getHcloudClient(): HCloud;
    /**
     * The function "getOrgName" returns the name of the organization coming from initial execution request.
     * @returns Name of the organization
     */
    getOrgName(): string;
    /**
     * The function "getSpaceName" returns the name of the space coming from initial execution request.
     * @returns Name of the High5 space
     */
    getSpaceName(): string;
    /**
     * Update the streams dashboard message
     * @param {string} message - New message
     */
    setStreamMessage(message: string): void;
};

type Logger = {
    /**
     * Gets the current progress value of the node
     * @returns The current progress value or undefined if not found or set
     */
    getCurrentProgress(): number | undefined;
    /**
     * Gets the current message of the node
     * @returns The current message value or undefined if not found or set
     */
    getCurrentMessage(): string | undefined;
    /**
     * Update the nodes progress
     * @param {number} progress - New progress value
     */
    updateProgress(progress: number): void;
    /**
     * Update the nodes status message
     * @param {string} message - The new message
     */
    updateMessage(message: string): void;
    /**
     * Update the nodes progress and status message simultaneously
     * @param {number} progress - New progress value
     * @param {string} message - New message
     */
    updateProgressAndMessage(progress: number, message: string): void;
};

type Inputs = {
    /**
     * Get all existing input objects
     * @returns a list of `StreamNodeResolvedInput` objects or an empty list if node has no inputs
     */
    getInputs(): StreamNodeResolvedInput[];
    /**
     * Get the input object by name
     * @param {string} inputName - Name of the input
     * @returns a `StreamNodeResolvedInput` object or `undefined` if not found
     */
    getInputByName(inputName: string): StreamNodeResolvedInput | undefined;
    /**
     * Get the pre-resolved input object by name (like in the node specification above)
     * @param {string} inputName - Name of the input
     * @returns a `StreamNodeSpecificationInput` object or `undefined` if not found
     */
    getPreresolvedInputByName(inputName: string): StreamNodeSpecificationInput | undefined;
    /**
     * Get the input value by name
     * @param {string} inputName - Name of the input
     * @returns the value of the input or `undefined` if not found
     */
    getInputValueByInputName(inputName: string): unknown;
    /**
     * Get the input original value (pre- wildcard resolved) by name
     * @param {string} inputName - Name of the input
     * @returns the original value of the input or `undefined` if not found
     */
    getInputOriginalValueByInputName(inputName: string): unknown;
};

type StreamNodeResolvedInput = {
    name: string;
    value: unknown;
    originalValue: unknown;
};

type Outputs = {
    /**
     * Get all existing output objects
     * @returns a list of `StreamNodeOutput` objects or an empty list if node has no outputs
     */
    getAllOutputs(): StreamNodeOutput[];
    /**
     * Get the output object by name
     * @param {string} outputName - Name of the output
     * @returns a `StreamNodeOutput` object or `undefined` if not found
     */
    getOutputByName(outputName: string): StreamNodeOutput | undefined;
    /**
     * Get the output value by name
     * @param {string} outputName - Name of the output
     * @returns the value of the output or `undefined` if not found
     */
    getOutputValueByOutputName(outputName: string): unknown;
    /**
     * The function "setOutput" updates or adds an outputs value. Output can be seen as one node
     * result.
     * @param {string} name - Name of the output
     * @param {any} value - Value to be set
     */
    setOutput(name: string, value: unknown): void;
    /**
     * The async function executes an additional connector and returns the stream result of that connector.
     * If connector wasn't found undefined is returned.
     * @param {string} connectorName - Name of the connector
     * @returns the stream result or undefined if connector wasn't found by name
     */
    executeAdditionalConnector(connectorName: string): Promise<StreamResult | undefined>;
};

type FileAndFolderHelper = {
    /**
     * Creates an empty file.
     * @param filePath File path with file extension
     * @param duplicateFileOption Option defining how to handle an already existing file with the same name
     * @returns final path of the created file. If the file already exists and duplicateFileOption = SKIP, the already existing file path will be returned.
     */
    createFile(filePath: string, duplicateFileOption: DuplicateFileOption): Promise<string>;
    /**
     * Creates a folder.
     * @param folderPath Folder path
     * @param duplicateFolderOption Option defining how to handle an already existing folder with the same name
     * @returns final path of the created folder. If the folder already exists and duplicateFolderOption = SKIP, the already existing folder path will be returned.
     */
    createFolder(folderPath: string, duplicateFolderOption: DuplicateFolderOption): Promise<string>;
    /**
     * Copies a file to the specified location.
     * @param srcFilePath Source file path with file extension
     * @param destFilePath Destination file path with file extension
     * @param duplicateFileOption Option defining how to handle an already existing file with the same name
     * @param progressCallback (Optional) callback function that will be called whenever there is measurable progress
     * @returns final path of the copied file. If the provided dest file already exists and duplicateFileOption = SKIP, the source file path will be returned.
     */
    copyFile(
        srcFilePath: string,
        destFilePath: string,
        duplicateFileOption: DuplicateFileOption,
        progressCallback?: (percent: number) => void
    ): Promise<string>;
    /**
     * Copies a folder to the specified location.
     * @param srcFolderPath Source folder path
     * @param destFolderPath Destination folder path
     * @param duplicateFolderOption Option defining how to handle an already existing folder with the same name
     * @param progressCallback (Optional) Function that will be called whenever there is measurable progress
     * @returns final path of the copied folder. If the provided dest folder already exists and duplicateFolderOption = SKIP, the source folder path will be returned.
     */
    copyFolder(
        srcFolderPath: string,
        destFolderPath: string,
        duplicateFolderOption: DuplicateFolderOption,
        progressCallback?: (percent: number) => void
    ): Promise<string>;
    /**
     * Moves a file to the specified location.
     * @param srcFilePath Source file path with file extension
     * @param destFilePath Destination file path with file extension
     * @param duplicateFileOption Option defining how to handle an already existing file with the same name
     * @param progressCallback (Optional) callback function that will be called whenever there is measurable progress
     * @returns final path of the moved file. If the provided dest file already exists and duplicateFileOption = SKIP, the source file path will be returned.
     */
    moveFile(
        srcFilePath: string,
        destFilePath: string,
        duplicateFileOption: DuplicateFileOption,
        progressCallback?: (percent: number) => void
    ): Promise<string>;
    /**
     * Moves a folder to the specified location.
     * @param srcFolderPath Source folder path
     * @param destFolderPath Destination folder path
     * @param duplicateFolderOption Option defining how to handle an already existing folder with the same name
     * @param progressCallback (optional) callback function that will be called whenever there is measurable progress (WORK IN PROGRESS)
     * @returns final path of the moved folder. If the provided dest folder already exists and duplicateFolderOption = SKIP, the source folder path will be returned.
     */
    moveFolder(
        srcFolderPath: string,
        destFolderPath: string,
        duplicateFolderOption: DuplicateFolderOption,
        progressCallback?: (percent: number) => void
    ): Promise<string>;
    /**
     * Renames a file.
     * @param filePath File path with file extension
     * @param newName New name of the file, without file extension
     * @returns final path of the renamed file. If a file with the provided name already exists and duplicateFileOption = SKIP, the source file path will be returned.
     */
    renameFile(filePath: string, newName: string, duplicateFileOption: DuplicateFileOption): Promise<string>;
    /**
     * Renames a folder.
     * @param folderPath Path of the folder to rename
     * @param newName New name of the folder
     * @returns final path of the renamed folder. If a folder with the provided name already exists and duplicateFolderOption = SKIP, the source folder path will be returned.
     */
    renameFolder(folderPath: string, newName: string, duplicateFolderOption: DuplicateFolderOption): Promise<string>;
    /**
     * Deletes a file.
     * @param filePath File path with file extension
     */
    deleteFile(filePath: string): Promise<void>;
    /**
     * Deletes a folder.
     * @param folderPath Folder path
     */
    deleteFolder(folderPath: string): Promise<void>;
};

type AxiosHelper = {
    /**
     * Makes an axios request based on the provided AxiosRequestConfig object and returns
     * the body of the response (response.data). If the HTTP response has a status
     * code outside of range 2xx, an error with the error message provided by the
     * requested ressource will be thrown. You can suppress this error by setting the
     * 'validateStatus' property of the config object accordingly.
     */
    makeRequest(config: AxiosRequestConfig): Promise<unknown>;
    /**
     * Converts a AxiosRequestConfig object into a curl command string. Does not support form data! Example output:
     * 
     * 'curl -X POST \
      -H "Authorization: Bearer your-api-key-here" \
      -H "Content-Type: application/json" \
      -d '{ "name": "helmut.cloud", "start": "2023-04-15T10:00:00", "end": "2023-04-15T16:00:00" }' \
      https://api.example.com/'
     */
    convertRequestToCurl(config: AxiosRequestConfig): string;
    /**
     * Removes all properties (also nested) from an object that are either undefined, null or
     * empty (empty objects, arrays, strings). This method can be helpful in scenarios where
     * you want to forward user input data - which can be empty or undefined - directly to an
     * API via Axios, which does not strip empty/undefined fields by default.
     */
    removeEmptyFields(obj: Record<string, unknown>): Record<string, unknown>;
};
