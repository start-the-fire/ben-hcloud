export enum DuplicateFileOption {
    /**
     * Stops node execution if a file with the same name already exists in the target path.The Fail connector is activated if this condition is met.
     */
    FAIL = "Fail",
    /**
     * Skips moving the file if a file with the same name is present in the target path.The Success connector will be activated if this condition is met.
     */
    SKIP = "Skip",
    /**
     * Removes the existing file in the target path before copying the new file over.The Success connector will be activated if this condition is met.
     */
    OVERWRITE = "Overwrite",
    /**
     * Renames the existing file in the target path and appends the suffix _01 to the existing file.The Success connector will be activated if this condition is met.
     */
    RENAME_EXISTING = "Rename Existing",
    /**
     * Appends a suffix _N to the file."N" is an incremental counter that starts at 01 and continues until a unique filename is generated.The Success connector will be activated if this condition is met.
     */
    INCREMENT_NAME = "Increment Name",
}
