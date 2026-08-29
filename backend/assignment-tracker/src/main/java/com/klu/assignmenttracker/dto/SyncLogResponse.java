package com.klu.assignmenttracker.dto;

import com.klu.assignmenttracker.model.SyncLog;
import com.klu.assignmenttracker.model.SyncStatus;
import com.klu.assignmenttracker.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

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
    private String studentId;
    private String studentName;
    private Instant startedAt;
    private Instant completedAt;
    private SyncStatus status;
    private int assignmentsFound;
    private int examsFound;
    private String errorMessage;

    /** Convert a SyncLog model and User model to a SyncLogResponse DTO */
    public static SyncLogResponse fromSyncLog(SyncLog syncLog, User user) {
        String studentId = null;
        String studentName = null;

        if (user != null) {
            studentId = user.getStudentId();
            studentName = user.getName();
            if (studentName == null || studentName.isBlank()) {
                studentName = user.getStudentId() != null ? user.getStudentId() : "Unknown Student";
            }
        }

        return SyncLogResponse.builder()
                .id(syncLog.getId())
                .userId(syncLog.getUserId())
                .studentId(studentId)
                .studentName(studentName)
                .startedAt(syncLog.getStartedAt())
                .completedAt(syncLog.getCompletedAt())
                .status(syncLog.getStatus())
                .assignmentsFound(syncLog.getAssignmentsFound())
                .examsFound(syncLog.getExamsFound())
                .errorMessage(syncLog.getErrorMessage())
                .build();
    }

    /** Convert a SyncLog model to a SyncLogResponse DTO (without user details) */
    public static SyncLogResponse fromSyncLog(SyncLog syncLog) {
        return fromSyncLog(syncLog, null);
    }
}

