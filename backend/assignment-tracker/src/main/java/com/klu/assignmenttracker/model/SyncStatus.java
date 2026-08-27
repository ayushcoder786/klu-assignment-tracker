package com.klu.assignmenttracker.model;

/**
 * Status of a sync operation with the Moodle LMS.
 */
public enum SyncStatus {
    /** Sync is currently running */
    RUNNING,
    /** Sync completed successfully */
    SUCCESS,
    /** Sync failed with an error */
    FAILED,
    /** Sync was skipped (Moodle API not yet implemented) */
    SKIPPED
}
