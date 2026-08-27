package com.klu.assignmenttracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Records each sync attempt with Moodle.
 * Useful for debugging and showing users when their data was last refreshed.
 * Stored in the "sync_logs" MongoDB collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sync_logs")
public class SyncLog {

    /** MongoDB document ID */
    @Id
    private String id;

    /** Which user triggered or this sync was run for */
    private String userId;

    /** When the sync started */
    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    /** When the sync finished (null if still running) */
    private LocalDateTime completedAt;

    /** RUNNING, SUCCESS, FAILED, or SKIPPED */
    @Builder.Default
    private SyncStatus status = SyncStatus.RUNNING;

    /** How many assignments were found during this sync */
    @Builder.Default
    private int assignmentsFound = 0;

    /** Error details if the sync failed */
    private String errorMessage;
}
