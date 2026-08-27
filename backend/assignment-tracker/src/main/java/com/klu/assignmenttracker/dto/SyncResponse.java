package com.klu.assignmenttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response after triggering a sync operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncResponse {

    /** Human-readable message about what happened */
    private String message;

    /** Details of the sync log entry that was created */
    private SyncLogResponse syncLog;
}
