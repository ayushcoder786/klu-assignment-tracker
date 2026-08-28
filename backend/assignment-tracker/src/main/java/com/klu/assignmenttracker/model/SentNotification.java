package com.klu.assignmenttracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Deduplication ledger: records every push notification that has been sent.
 *
 * <p>A unique compound index on (userId, assignmentId, notificationType, dueDateVersion)
 * ensures we never send the same notification twice for the same assignment/event.
 * If the due date changes, a new DEADLINE_CHANGED notification is allowed because
 * the dueDateVersion will differ.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sent_notifications")
@CompoundIndexes({
    @CompoundIndex(
        name = "dedup_idx",
        def = "{'userId': 1, 'assignmentId': 1, 'notificationType': 1, 'dueDateVersion': 1}",
        unique = true
    )
})
public class SentNotification {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String assignmentId;

    private NotificationType notificationType;

    /**
     * Serialised due date at the time of sending (ISO-8601 string).
     * For NEW_ASSIGNMENT / OVERDUE / DUE_TODAY / DUE_TOMORROW this is the
     * assignment's dueDate.  For DEADLINE_CHANGED it is the *new* due date,
     * which allows one notification per change event.
     * Empty string ("") is used when the assignment has no due date.
     */
    @Builder.Default
    private String dueDateVersion = "";

    @Builder.Default
    private Instant sentAt = Instant.now();
}
