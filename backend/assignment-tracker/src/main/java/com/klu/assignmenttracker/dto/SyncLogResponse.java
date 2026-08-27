package com.klu.assignmenttracker.dto;

import com.klu.assignmenttracker.model.SyncLog;
import com.klu.assignmenttracker.model.SyncStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * API response representing a SyncLog entry.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncLogResponse {

    private String id;
    private String userId;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private SyncStatus status;
    private int assignmentsFound;
    private String errorMessage;

    /** Convert a SyncLog model to a SyncLogResponse DTO */
    public static SyncLogResponse fromSyncLog(SyncLog syncLog) {
        return SyncLogResponse.builder()
                .id(syncLog.getId())
                .userId(syncLog.getUserId())
                .startedAt(syncLog.getStartedAt())
                .completedAt(syncLog.getCompletedAt())
                .status(syncLog.getStatus())
                .assignmentsFound(syncLog.getAssignmentsFound())
                .errorMessage(syncLog.getErrorMessage())
                .build();
    }
}
