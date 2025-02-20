export enum DuplicateFolderOption {
    /**
     * Stops node execution if a folder with the same name already exists in the target path. In cases where multiple folders are provided for creation, the node will stop at the first instance of a conflict. The Fail connector is activated if this condition is met.
     */
    FAIL = "Fail",
    /**
     * Skips folder creation when a folder with the same name is present in the target path. The Success connector will be activated if this condition is met.
     */
    SKIP = "Skip",
    /**
     * Renames the existing folder in the target path and appends the suffix _v01 to the existing folder. The Success connector will be activated if this condition is met.
     */
    RENAME_EXISTING = "Rename Existing",
    /**
     * Appends a suffix _v[sequential two digit number] where the number increases sequentially for each new folder version of the folder name the user specified. The Success connector will be activated if this condition is met.
     */
    INCREMENT_NAME = "Increment Name",
}
