package com.klu.assignmenttracker.repository;

import com.klu.assignmenttracker.model.NotificationType;
import com.klu.assignmenttracker.model.SentNotification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SentNotificationRepository extends MongoRepository<SentNotification, String> {

    /**
     * Check whether a specific notification has already been sent.
     * Used for deduplication before sending any push notification.
     */
    boolean existsByUserIdAndAssignmentIdAndNotificationTypeAndDueDateVersion(
            String userId,
            String assignmentId,
            NotificationType notificationType,
            String dueDateVersion
    );

    /**
     * Look up a sent notification record (used for deadline-change detection).
     */
    Optional<SentNotification> findByUserIdAndAssignmentIdAndNotificationType(
            String userId,
            String assignmentId,
            NotificationType notificationType
    );
}
