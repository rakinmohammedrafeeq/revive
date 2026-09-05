package com.revive.enums;

/**
 * Status of a training data export
 */
public enum ExportStatus {
    /**
     * Export has been initiated but not yet completed
     */
    INITIATED,
    
    /**
     * Export completed successfully
     */
    COMPLETED,
    
    /**
     * Export failed with error
     */
    FAILED
}
