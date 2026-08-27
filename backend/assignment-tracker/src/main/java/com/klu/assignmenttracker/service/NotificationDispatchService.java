package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.model.Assignment;
import com.klu.assignmenttracker.model.AssignmentStatus;
import com.klu.assignmenttracker.model.NotificationPreferences;
import com.klu.assignmenttracker.model.NotificationType;
import com.klu.assignmenttracker.model.SentNotification;
import com.klu.assignmenttracker.repository.AssignmentRepository;
import com.klu.assignmenttracker.repository.NotificationPreferencesRepository;
import com.klu.assignmenttracker.repository.SentNotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Evaluates which push notifications to send after a sync cycle.
 *
 * <p>Deduplication strategy: before sending any notification, we attempt to insert
 * a {@link SentNotification} record. The compound unique index on
 * (userId, assignmentId, notificationType, dueDateVersion) prevents duplicate sends
 * at the database level. A {@link DuplicateKeyException} is caught and treated as
 * "already sent — skip".
 *
 * <p>Notification types:
 * <ul>
 *   <li>NEW_ASSIGNMENT — assignment.firstSeen is within the last sync window</li>
 *   <li>DUE_TOMORROW — due in 20–28 hours, status PENDING</li>
 *   <li>DUE_TODAY — due today (within next 20 hours), status PENDING</li>
 *   <li>OVERDUE — status is OVERDUE</li>
 *   <li>DEADLINE_CHANGED — stored dueDate differs from previously recorded dueDate</li>
 * </ul>
 */
@Service
public class NotificationDispatchService {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatchService.class);
    private static final DateTimeFormatter DUE_DATE_FMT = DateTimeFormatter.ofPattern("d MMM, h:mm a");
    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final AssignmentRepository assignmentRepository;
    private final NotificationPreferencesRepository preferencesRepository;
    private final SentNotificationRepository sentNotificationRepository;
    private final PushNotificationService pushNotificationService;

    public NotificationDispatchService(
            AssignmentRepository assignmentRepository,
            NotificationPreferencesRepository preferencesRepository,
            SentNotificationRepository sentNotificationRepository,
            PushNotificationService pushNotificationService) {
        this.assignmentRepository = assignmentRepository;
        this.preferencesRepository = preferencesRepository;
        this.sentNotificationRepository = sentNotificationRepository;
        this.pushNotificationService = pushNotificationService;
    }

    /**
     * Evaluate and send all pending notifications for a user after a sync.
     *
     * @param userId     the internal MongoDB user ID
     * @param syncedAt   timestamp of when the sync completed
     * @param syncWindow how many minutes back to look for "new" assignments
     */
    public void dispatchForUser(String userId, LocalDateTime syncedAt, int syncWindow) {
        if (!pushNotificationService.isConfigured()) {
            return;
        }

        NotificationPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> NotificationPreferences.builder().userId(userId).build());

        List<Assignment> assignments = assignmentRepository.findByUserId(userId);

        for (Assignment a : assignments) {
            try {
                evaluateAndDispatch(a, prefs, syncedAt, syncWindow);
            } catch (Exception e) {
                log.warn("Error dispatching notifications for assignmentId={}: {}", a.getId(), e.getMessage());
            }
        }
    }

    private void evaluateAndDispatch(Assignment a, NotificationPreferences prefs,
                                      LocalDateTime syncedAt, int syncWindow) {
        LocalDateTime now = LocalDateTime.now();
        String userId = a.getUserId();
        String assignmentId = a.getId();
        String courseName = a.getCourseName() != null ? a.getCourseName() : "Course";
        String title = a.getTitle() != null ? a.getTitle() : "Assignment";
        LocalDateTime dueDate = a.getDueDate();
        String dueDateStr = dueDate != null ? dueDate.format(ISO_FMT) : "";

        // ── 1. NEW ASSIGNMENT ─────────────────────────────────────────────────
        if (prefs.isNewAssignment() && a.getFirstSeen() != null) {
            long minutesSinceSeen = ChronoUnit.MINUTES.between(a.getFirstSeen(), syncedAt);
            if (minutesSinceSeen <= syncWindow + 5) {
                // Assignment was first seen in this or the previous sync cycle
                tryRecord(userId, assignmentId, NotificationType.NEW_ASSIGNMENT, "", () ->
                    pushNotificationService.sendToUser(
                        userId,
                        "🔔 New Assignment",
                        courseName + " — " + title + (dueDate != null ? ". Due: " + dueDate.format(DUE_DATE_FMT) : ""),
                        assignmentId
                    )
                );
            }
        }

        // Skip time-based notifications if no due date
        if (dueDate == null) return;

        long hoursUntilDue = ChronoUnit.HOURS.between(now, dueDate);

        // ── 2. DUE TOMORROW ──────────────────────────────────────────────────
        if (prefs.isDueTomorrow()
                && hoursUntilDue >= 20 && hoursUntilDue <= 28
                && a.getStatus() == AssignmentStatus.PENDING) {
            tryRecord(userId, assignmentId, NotificationType.DUE_TOMORROW, dueDateStr, () ->
                pushNotificationService.sendToUser(
                    userId,
                    "📅 Due Tomorrow",
                    courseName + " — " + title + " is due tomorrow at " + dueDate.format(DUE_DATE_FMT),
                    assignmentId
                )
            );
        }

        // ── 3. DUE TODAY ─────────────────────────────────────────────────────
        if (prefs.isDueToday()
                && hoursUntilDue >= 0 && hoursUntilDue < 20
                && a.getStatus() == AssignmentStatus.PENDING) {
            tryRecord(userId, assignmentId, NotificationType.DUE_TODAY, dueDateStr, () ->
                pushNotificationService.sendToUser(
                    userId,
                    "⏰ Due Today",
                    courseName + " — " + title + " is due today at " + dueDate.format(DUE_DATE_FMT),
                    assignmentId
                )
            );
        }

        // ── 4. OVERDUE ───────────────────────────────────────────────────────
        if (prefs.isOverdue() && a.getStatus() == AssignmentStatus.OVERDUE) {
            tryRecord(userId, assignmentId, NotificationType.OVERDUE, dueDateStr, () ->
                pushNotificationService.sendToUser(
                    userId,
                    "🚨 Assignment Overdue",
                    courseName + " — " + title + " was due on " + dueDate.format(DUE_DATE_FMT),
                    assignmentId
                )
            );
        }

        // ── 5. DEADLINE CHANGED ──────────────────────────────────────────────
        if (prefs.isDeadlineChanged()) {
            checkDeadlineChanged(userId, assignmentId, courseName, title, dueDate, dueDateStr);
        }
    }

    /**
     * Detect and notify about deadline changes by comparing with the last recorded
     * sent-notification record for DUE_TOMORROW or DUE_TODAY (which carry the due date at time of send).
     * We use a dedicated DEADLINE_CHANGED record keyed to the NEW due date.
     */
    private void checkDeadlineChanged(String userId, String assignmentId,
                                       String courseName, String title,
                                       LocalDateTime currentDueDate, String currentDueDateStr) {
        // Look up any previously recorded DUE_TOMORROW/TODAY notification — if exists and due date differs → changed
        sentNotificationRepository.findByUserIdAndAssignmentIdAndNotificationType(
                userId, assignmentId, NotificationType.DUE_TOMORROW)
            .ifPresent(prev -> {
                if (!prev.getDueDateVersion().equals(currentDueDateStr) && !prev.getDueDateVersion().isBlank()) {
                    tryRecord(userId, assignmentId, NotificationType.DEADLINE_CHANGED, currentDueDateStr, () ->
                        pushNotificationService.sendToUser(
                            userId,
                            "⚠️ Deadline Changed",
                            courseName + " — " + title + ". New deadline: " + currentDueDate.format(DUE_DATE_FMT),
                            assignmentId
                        )
                    );
                }
            });
    }

    /**
     * Attempt to record a sent notification and run the send action if successful.
     * Silently skips if the dedup record already exists (DuplicateKeyException).
     */
    private void tryRecord(String userId, String assignmentId,
                           NotificationType type, String dueDateVersion,
                           Runnable sendAction) {
        try {
            SentNotification record = SentNotification.builder()
                    .userId(userId)
                    .assignmentId(assignmentId)
                    .notificationType(type)
                    .dueDateVersion(dueDateVersion)
                    .sentAt(LocalDateTime.now())
                    .build();
            sentNotificationRepository.save(record);
            // Only send if save succeeded (dedup check passed)
            sendAction.run();
            log.info("Dispatched {} notification for userId={} assignmentId={}", type, userId, assignmentId);
        } catch (DuplicateKeyException e) {
            log.debug("Skipping duplicate {} notification for userId={} assignmentId={}", type, userId, assignmentId);
        }
    }
}
