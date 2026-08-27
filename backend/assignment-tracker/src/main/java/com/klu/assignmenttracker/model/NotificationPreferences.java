package com.klu.assignmenttracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Per-student notification preference settings.
 * One document per user; created with sensible defaults on first access.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notification_preferences")
public class NotificationPreferences {

    @Id
    private String id;

    /** The internal MongoDB user ID — unique, one preferences doc per user */
    @Indexed(unique = true)
    private String userId;

    /** Notify when a new assignment is discovered during sync */
    @Builder.Default
    private boolean newAssignment = true;

    /** Notify when an assignment is due approximately 24 hours from now */
    @Builder.Default
    private boolean dueTomorrow = true;

    /** Notify when an assignment is due today */
    @Builder.Default
    private boolean dueToday = true;

    /** Notify when an assignment becomes overdue */
    @Builder.Default
    private boolean overdue = true;

    /** Notify when Moodle reports a changed due date for an existing assignment */
    @Builder.Default
    private boolean deadlineChanged = true;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;
}
