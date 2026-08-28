package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.model.Role;
import com.klu.assignmenttracker.model.User;
import com.klu.assignmenttracker.repository.UserRepository;
import com.klu.assignmenttracker.security.MoodleTokenCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Scheduled service that automatically syncs assignments for all students.
 *
 * <p>Design principles:
 * <ul>
 *   <li>Only syncs students who have an active (non-expired) Moodle token in the in-memory cache.</li>
 *   <li>Never stores or retrieves LMS passwords — students must log in to refresh the token cache.</li>
 *   <li>A failure for one student never crashes the entire scheduler run.</li>
 *   <li>Safe information (studentId, counts) is logged. Tokens and passwords are never logged.</li>
 *   <li>The scheduler can be disabled via {@code app.sync.enabled=false} in application.properties.</li>
 *   <li>The interval is configurable via {@code app.sync.interval-minutes} in application.properties.</li>
 * </ul>
 */
@Service
public class NotificationSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(NotificationSchedulerService.class);

    @Value("${app.sync.enabled:true}")
    private boolean syncEnabled;

    @Value("${app.sync.interval-minutes:30}")
    private int syncIntervalMinutes;

    private final UserRepository userRepository;
    private final SyncService syncService;
    private final MoodleTokenCache moodleTokenCache;
    private final NotificationDispatchService notificationDispatchService;

    public NotificationSchedulerService(
            UserRepository userRepository,
            SyncService syncService,
            MoodleTokenCache moodleTokenCache,
            NotificationDispatchService notificationDispatchService) {
        this.userRepository = userRepository;
        this.syncService = syncService;
        this.moodleTokenCache = moodleTokenCache;
        this.notificationDispatchService = notificationDispatchService;
    }

    /**
     * Scheduled task that runs periodically.
     *
     * <p>The {@code fixedDelayString} reads {@code app.sync.interval-minutes} and
     * converts to milliseconds.  fixedDelay (not fixedRate) is used so that the
     * next run begins only AFTER the previous run has finished, preventing overlapping
     * sync operations.
     *
     * <p>Note: @Scheduled with a SpEL expression requires {@code @EnableScheduling}
     * on the application class.
     */
    @Scheduled(
            initialDelayString = "${app.sync.initial-delay-ms:60000}",
            fixedDelayString = "#{${app.sync.interval-minutes:30} * 60000}"
    )
    public void runScheduledSync() {
        if (!syncEnabled) {
            log.debug("Scheduled sync is disabled (app.sync.enabled=false). Skipping.");
            return;
        }

        log.info("Starting scheduled LMS sync for all students.");

        List<User> students = userRepository.findAll().stream()
                .filter(u -> u.getStudentId() != null && !u.getStudentId().isBlank())
                .toList();

        log.info("Found {} students to sync.", students.size());

        int synced = 0;
        int skipped = 0;
        int failed = 0;

        for (User student : students) {
            try {
                Optional<String> tokenOpt = moodleTokenCache.getToken(student.getId())
                        .or(() -> moodleTokenCache.getToken(student.getStudentId()));

                if (tokenOpt.isEmpty()) {
                    log.debug("Skipping scheduled sync for studentId={}: no active Moodle token in cache.", student.getStudentId());
                    skipped++;
                    continue;
                }

                Instant syncedAt = Instant.now();
                syncService.syncUserAssignments(student, tokenOpt.get());

                // After sync, dispatch any pending push notifications
                notificationDispatchService.dispatchForUser(
                        student.getId(), syncedAt, syncIntervalMinutes);

                synced++;
            } catch (Exception e) {
                // Log the error but NEVER stop the loop — one student's failure must not affect others
                log.warn("Scheduled sync encountered error for studentId={}: {}", student.getStudentId(), e.getMessage());
                failed++;
            }
        }

        log.info("Scheduled sync complete. Synced={}, Skipped (no token)={}, Failed={}", synced, skipped, failed);
    }
}
