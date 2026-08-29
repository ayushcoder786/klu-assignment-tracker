package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.dto.SyncLogResponse;
import com.klu.assignmenttracker.dto.SyncResponse;
import com.klu.assignmenttracker.dto.moodle.MoodleAssignmentCourse;
import com.klu.assignmenttracker.dto.moodle.MoodleAssignmentItem;
import com.klu.assignmenttracker.dto.moodle.MoodleAssignmentsResponse;
import com.klu.assignmenttracker.dto.moodle.MoodleCourse;
import com.klu.assignmenttracker.dto.moodle.MoodleQuizAttempt;
import com.klu.assignmenttracker.dto.moodle.MoodleQuizAttemptsResponse;
import com.klu.assignmenttracker.dto.moodle.MoodleQuizItem;
import com.klu.assignmenttracker.dto.moodle.MoodleQuizzesResponse;
import com.klu.assignmenttracker.dto.moodle.MoodleSiteInfo;
import com.klu.assignmenttracker.dto.moodle.MoodleSubmissionStatusResponse;
import com.klu.assignmenttracker.exception.ResourceNotFoundException;
import com.klu.assignmenttracker.model.Assignment;
import com.klu.assignmenttracker.model.AssignmentStatus;
import com.klu.assignmenttracker.model.Course;
import com.klu.assignmenttracker.model.Exam;
import com.klu.assignmenttracker.model.ExamStatus;
import com.klu.assignmenttracker.model.SyncLog;
import com.klu.assignmenttracker.model.SyncStatus;
import com.klu.assignmenttracker.model.User;
import com.klu.assignmenttracker.repository.AssignmentRepository;
import com.klu.assignmenttracker.repository.CourseRepository;
import com.klu.assignmenttracker.repository.ExamRepository;
import com.klu.assignmenttracker.repository.SyncLogRepository;
import com.klu.assignmenttracker.repository.UserRepository;
import com.klu.assignmenttracker.security.MoodleTokenCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Service that synchronizes courses, assignments, and e-exams directly from KLU Moodle Web Services.
 */
@Service
public class SyncService {

    private static final Logger log = LoggerFactory.getLogger(SyncService.class);

    private final SyncLogRepository syncLogRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final AssignmentRepository assignmentRepository;
    private final ExamRepository examRepository;
    private final MoodleWebService moodleWebService;
    private final MoodleTokenCache moodleTokenCache;

    public SyncService(SyncLogRepository syncLogRepository,
                       UserRepository userRepository,
                       CourseRepository courseRepository,
                       AssignmentRepository assignmentRepository,
                       ExamRepository examRepository,
                       MoodleWebService moodleWebService,
                       MoodleTokenCache moodleTokenCache) {
        this.syncLogRepository = syncLogRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.assignmentRepository = assignmentRepository;
        this.examRepository = examRepository;
        this.moodleWebService = moodleWebService;
        this.moodleTokenCache = moodleTokenCache;
    }

    /**
     * Asynchronously perform Moodle synchronization in the background.
     * Used during student login so the login HTTP request completes immediately.
     *
     * @param user        the user being synchronized
     * @param moodleToken active Moodle Web Service token
     * @return CompletableFuture of SyncResponse
     */
    @Async("taskExecutor")
    public CompletableFuture<SyncResponse> syncUserAssignmentsAsync(User user, String moodleToken) {
        log.info("Triggered asynchronous background sync for studentId={}", user.getStudentId());
        try {
            SyncResponse response = syncUserAssignments(user, moodleToken);
            return CompletableFuture.completedFuture(response);
        } catch (Exception e) {
            log.warn("Background sync encountered error for studentId={}: {}", user.getStudentId(), e.getMessage());
            return CompletableFuture.completedFuture(
                    SyncResponse.builder()
                            .message("LMS is temporarily unavailable. Please try syncing again later.")
                            .build()
            );
        }
    }

    /**
     * Perform a live sync with KLU Moodle for the specified user using the provided Moodle token.
     *
     * <p>Steps:
     * <ol>
     *   <li>Record a RUNNING sync log.</li>
     *   <li>Fetch student's Moodle site info and update full name in profile.</li>
     *   <li>Fetch enrolled courses and upsert Course documents.</li>
     *   <li>Fetch assignments for all enrolled courses and upsert Assignment documents.</li>
     *   <li>Check submission/completion status for each assignment.</li>
     *   <li>Update user's lastSync timestamp and complete the sync log with status SUCCESS.</li>
     * </ol>
     *
     * <p><strong>Fault tolerance:</strong> If the external KLU LMS fails or is unreachable,
     * the error is caught, logged, and marked as FAILED with a friendly message.
     * Existing assignments and user data in MongoDB are strictly preserved.
     *
     * @param user        the user being synchronized
     * @param moodleToken active Moodle Web Service token
     * @return SyncResponse with summary and saved SyncLog
     */
    public SyncResponse syncUserAssignments(User user, String moodleToken) {
        log.info("Starting Moodle assignment synchronization for studentId={}", user.getStudentId());

        SyncLog syncLog = SyncLog.builder()
                .userId(user.getId())
                .startedAt(Instant.now())
                .status(SyncStatus.RUNNING)
                .assignmentsFound(0)
                .build();
        syncLog = syncLogRepository.save(syncLog);

        try {
            // ── Step 1: Get Site Info (Moodle userId & full name) ──────────────
            MoodleSiteInfo siteInfo = moodleWebService.getSiteInfo(moodleToken);
            if (siteInfo != null && siteInfo.getFullname() != null && !siteInfo.getFullname().isBlank()) {
                user.setName(siteInfo.getFullname());
            }

            long moodleUserId = (siteInfo != null && siteInfo.getUserid() != null) ? siteInfo.getUserid() : 0L;
            if (moodleUserId == 0L) {
                throw new IllegalStateException("Moodle site info did not return a valid user ID.");
            }

            // ── Step 2: Get Enrolled Courses ──────────────────────────────────
            List<MoodleCourse> moodleCourses = moodleWebService.getEnrolledCourses(moodleToken, moodleUserId);
            log.info("Fetched {} enrolled courses from Moodle for studentId={}", moodleCourses.size(), user.getStudentId());

            Map<String, Course> savedCoursesByMoodleId = new HashMap<>();

            for (MoodleCourse mc : moodleCourses) {
                if (mc.getId() == null || mc.getId() <= 1) {
                    // Skip site-level root course (id=1)
                    continue;
                }

                String moodleCourseId = String.valueOf(mc.getId());
                Course course = courseRepository.findByUserIdAndMoodleCourseId(user.getId(), moodleCourseId)
                        .orElseGet(() -> Course.builder()
                                .userId(user.getId())
                                .moodleCourseId(moodleCourseId)
                                .build());

                course.setName(mc.getFullname() != null ? mc.getFullname() : mc.getDisplayname());
                course.setShortName(mc.getShortname());
                Course savedCourse = courseRepository.save(course);
                savedCoursesByMoodleId.put(moodleCourseId, savedCourse);
            }

            // ── Step 3: Get Assignments for Courses ───────────────────────────
            List<Long> courseIdsToQuery = savedCoursesByMoodleId.keySet().stream()
                    .map(Long::valueOf)
                    .toList();

            int totalAssignments = 0;

            if (!courseIdsToQuery.isEmpty()) {
                MoodleAssignmentsResponse assignmentsResp = moodleWebService.getAssignments(moodleToken, courseIdsToQuery);

                if (assignmentsResp.getCourses() != null) {
                    for (MoodleAssignmentCourse mac : assignmentsResp.getCourses()) {
                        if (mac.getAssignments() == null || mac.getAssignments().isEmpty()) {
                            continue;
                        }

                        String moodleCourseId = String.valueOf(mac.getId());
                        Course courseDoc = savedCoursesByMoodleId.get(moodleCourseId);
                        String courseDocId = courseDoc != null ? courseDoc.getId() : null;
                        String courseDisplayName = courseDoc != null ? courseDoc.getName() : mac.getFullname();

                        for (MoodleAssignmentItem item : mac.getAssignments()) {
                            if (item.getId() == null) {
                                continue;
                            }

                            String moodleAssignmentId = String.valueOf(item.getId());
                            Instant startDate = parseTimestamp(item.getAllowsubmissionsfromdate());
                            Instant dueDate = parseTimestamp(item.getDuedate());
                            Instant cutoffDate = parseTimestamp(item.getCutoffdate());

                            // Check submission status from Moodle
                            AssignmentStatus status = determineAssignmentStatus(
                                     moodleToken, item.getId(), dueDate, startDate);

                            String cleanDescription = stripHtml(item.getIntro());

                            Assignment assignment = assignmentRepository
                                    .findByUserIdAndMoodleAssignmentId(user.getId(), moodleAssignmentId)
                                    .orElseGet(() -> Assignment.builder()
                                            .userId(user.getId())
                                            .moodleAssignmentId(moodleAssignmentId)
                                            .firstSeen(Instant.now())
                                            .build());

                            assignment.setCourseId(courseDocId);
                            assignment.setCourseName(courseDisplayName);
                            assignment.setTitle(item.getName() != null ? item.getName().trim() : "Untitled Assignment");
                            assignment.setDescription(cleanDescription);
                            assignment.setStartDate(startDate);
                            assignment.setDueDate(dueDate);
                            assignment.setCutoffDate(cutoffDate);
                            assignment.setStatus(status);
                            assignment.setLastChecked(Instant.now());

                            assignmentRepository.save(assignment);
                            totalAssignments++;
                        }
                    }
                }
            }

            // ── Step 4: Get E-Exams / Quizzes for Courses ─────────────────────
            int totalExams = 0;
            int quizzesInserted = 0;
            int quizzesUpdated = 0;
            int quizzesSkipped = 0;
            int apiFailures = 0;

            log.info("Starting Moodle quiz synchronization for studentId={} across {} enrolled courses",
                    user.getStudentId(), courseIdsToQuery.size());

            if (!courseIdsToQuery.isEmpty()) {
                try {
                    MoodleQuizzesResponse quizzesResp = moodleWebService.getQuizzes(moodleToken, courseIdsToQuery);
                    if (quizzesResp != null && quizzesResp.getQuizzes() != null) {
                        List<MoodleQuizItem> quizList = quizzesResp.getQuizzes();
                        log.info("Received {} total quiz activities from Moodle for studentId={}",
                                quizList.size(), user.getStudentId());

                        for (MoodleQuizItem qItem : quizList) {
                            if (qItem.getId() == null) {
                                quizzesSkipped++;
                                log.debug("Skipped quiz with null ID for studentId={}", user.getStudentId());
                                continue;
                            }

                            String moodleQuizId = String.valueOf(qItem.getId());
                            String courseModuleId = (qItem.getCoursemodule() != null && qItem.getCoursemodule() > 0)
                                    ? String.valueOf(qItem.getCoursemodule())
                                    : null;
                            String moodleCourseId = qItem.getCourse() != null ? String.valueOf(qItem.getCourse()) : null;
                            Course courseDoc = moodleCourseId != null ? savedCoursesByMoodleId.get(moodleCourseId) : null;
                            String courseDocId = courseDoc != null ? courseDoc.getId() : null;
                            String courseDisplayName = courseDoc != null ? courseDoc.getName() : "Course " + moodleCourseId;

                            Instant openDate = parseTimestamp(qItem.getTimeopen());
                            Instant closeDate = parseTimestamp(qItem.getTimeclose());

                            // Check attempts & determine exam status with Moodle user ID and best grade
                            ExamStatusInfo statusInfo = determineExamStatus(
                                    moodleToken, qItem.getId(), moodleUserId, openDate, closeDate, qItem.getGrade());

                            String cleanDescription = stripHtml(qItem.getIntro());
                            String lmsUrl = (courseModuleId != null && !courseModuleId.isBlank())
                                    ? "https://lms.kluniversity.in/mod/quiz/view.php?id=" + courseModuleId
                                    : "https://lms.kluniversity.in/mod/quiz/view.php?q=" + moodleQuizId;

                            Optional<Exam> existingOpt = examRepository.findByUserIdAndMoodleQuizId(user.getId(), moodleQuizId);
                            Exam exam;
                            if (existingOpt.isPresent()) {
                                exam = existingOpt.get();
                                quizzesUpdated++;
                            } else {
                                exam = Exam.builder()
                                        .userId(user.getId())
                                        .moodleQuizId(moodleQuizId)
                                        .firstSeen(Instant.now())
                                        .build();
                                quizzesInserted++;
                            }

                            exam.setCourseModuleId(courseModuleId);
                            exam.setCourseId(courseDocId);
                            exam.setCourseName(courseDisplayName);
                            exam.setTitle(qItem.getName() != null ? qItem.getName().trim() : "Untitled Exam");
                            exam.setDescription(cleanDescription);
                            exam.setOpenDate(openDate);
                            exam.setCloseDate(closeDate);
                            exam.setTimeLimit(qItem.getTimelimit());
                            exam.setAttemptsAllowed(qItem.getAttempts());
                            exam.setAttemptsCount(statusInfo.attemptsCount());
                            exam.setMaxGrade(qItem.getGrade());
                            exam.setObtainedGrade(statusInfo.obtainedGrade());
                            exam.setLmsUrl(lmsUrl);
                            exam.setStatus(statusInfo.status());
                            exam.setCompletedAt(statusInfo.completedAt());
                            exam.setLastChecked(Instant.now());

                            examRepository.save(exam);
                            totalExams++;
                        }
                    } else {
                        log.warn("Moodle returned empty or null quizzes response for studentId={}", user.getStudentId());
                    }
                } catch (Exception e) {
                    apiFailures++;
                    log.error("Could not synchronize quizzes from Moodle for studentId={}: {}", user.getStudentId(), e.getMessage(), e);
                }
            }

            log.info("Quiz synchronization completed for studentId={}: totalExams={}, inserted={}, updated={}, skipped={}, apiFailures={}",
                    user.getStudentId(), totalExams, quizzesInserted, quizzesUpdated, quizzesSkipped, apiFailures);

            // ── Step 5: Finalize User & SyncLog ───────────────────────────────
            user.setLastSync(Instant.now());
            userRepository.save(user);

            syncLog.setStatus(SyncStatus.SUCCESS);
            syncLog.setAssignmentsFound(totalAssignments);
            syncLog.setExamsFound(totalExams);
            syncLog.setCompletedAt(Instant.now());
            syncLog.setErrorMessage(null);
            SyncLog savedLog = syncLogRepository.save(syncLog);

            log.info("Moodle synchronization completed successfully for studentId={}. Total assignments: {}, Total e-exams: {}",
                    user.getStudentId(), totalAssignments, totalExams);

            String syncMessage = "Successfully synchronized " + totalAssignments + " assignments and " + totalExams + " e-exams/tests from KLU Moodle.";

            return SyncResponse.builder()
                    .message(syncMessage)
                    .syncLog(SyncLogResponse.fromSyncLog(savedLog, user))
                    .build();

        } catch (Exception e) {
            log.warn("KLU LMS assignment sync failed for studentId={}: {}",
                    user.getStudentId(), e.getMessage());

            syncLog.setStatus(SyncStatus.FAILED);
            syncLog.setCompletedAt(Instant.now());
            syncLog.setErrorMessage("LMS is temporarily unavailable. Please try syncing again later.");
            SyncLog savedLog = syncLogRepository.save(syncLog);

            return SyncResponse.builder()
                    .message("LMS is temporarily unavailable. Please try syncing again later.")
                    .syncLog(SyncLogResponse.fromSyncLog(savedLog, user))
                    .build();
        }
    }

    /**
     * Trigger a sync for the currently authenticated user.
     *
     * @param subject JWT subject (studentId or email)
     * @return sync response
     */
    public SyncResponse triggerSync(String subject) {
        User user = userRepository.findByStudentId(subject)
                .or(() -> userRepository.findByEmail(subject))
                .orElseThrow(() -> new ResourceNotFoundException("User", "subject", subject));

        // Look up active token in memory
        Optional<String> tokenOpt = moodleTokenCache.getToken(user.getId())
                .or(() -> moodleTokenCache.getToken(user.getStudentId()));

        if (tokenOpt.isPresent()) {
            return syncUserAssignments(user, tokenOpt.get());
        }

        log.warn("Sync triggered for user {} but no active Moodle token found in memory.", user.getStudentId());

        SyncLog syncLog = SyncLog.builder()
                .userId(user.getId())
                .startedAt(Instant.now())
                .completedAt(Instant.now())
                .status(SyncStatus.SKIPPED)
                .assignmentsFound(0)
                .errorMessage("No active LMS session token in memory. Please log in again to sync live from Moodle.")
                .build();
        SyncLog savedLog = syncLogRepository.save(syncLog);

        return SyncResponse.builder()
                .message("Sync skipped: No active LMS session token in memory. Please log in again to refresh from KLU LMS.")
                .syncLog(SyncLogResponse.fromSyncLog(savedLog, user))
                .build();
    }

    /**
     * Trigger a sync for a specific user by their ID (admin action).
     */
    public SyncResponse triggerSyncForUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return triggerSync(user.getStudentId() != null ? user.getStudentId() : user.getEmail());
    }

    /**
     * Get all sync logs across all users (admin only).
     * Maps each sync log with the corresponding student/user details.
     */
    public List<SyncLogResponse> getAllSyncLogs() {
        Map<String, User> userMap = userRepository.findAll().stream()
                .filter(u -> u.getId() != null)
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return syncLogRepository.findAllByOrderByStartedAtDesc()
                .stream()
                .map(log -> SyncLogResponse.fromSyncLog(log, userMap.get(log.getUserId())))
                .collect(Collectors.toList());
    }

    /**
     * Get sync logs for a specific user.
     */
    public List<SyncLogResponse> getSyncLogsByUserId(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        return syncLogRepository.findByUserIdOrderByStartedAtDesc(userId)
                .stream()
                .map(log -> SyncLogResponse.fromSyncLog(log, user))
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper Methods
    // ─────────────────────────────────────────────────────────────────────────

    private AssignmentStatus determineAssignmentStatus(String moodleToken, long assignId, Instant dueDate, Instant startDate) {
        MoodleSubmissionStatusResponse subStatus = moodleWebService.getSubmissionStatus(moodleToken, assignId);

        if (subStatus != null && subStatus.getLastattempt() != null) {
            Boolean graded = subStatus.getLastattempt().getGraded();
            var submission = subStatus.getLastattempt().getSubmission();

            if (Boolean.TRUE.equals(graded) || (submission != null && "graded".equalsIgnoreCase(submission.getGradingstatus()))) {
                return AssignmentStatus.GRADED;
            }

            if (submission != null && "submitted".equalsIgnoreCase(submission.getStatus())) {
                return AssignmentStatus.SUBMITTED;
            }
        }

        Instant now = Instant.now();

        if (startDate != null && startDate.isAfter(now)) {
            return AssignmentStatus.UPCOMING;
        }

        if (dueDate == null) {
            return AssignmentStatus.PENDING;
        }

        if (dueDate.isBefore(now)) {
            return AssignmentStatus.OVERDUE;
        }

        return AssignmentStatus.PENDING;
    }

    private ExamStatusInfo determineExamStatus(String moodleToken, long quizId, long moodleUserId,
                                                Instant openDate, Instant closeDate, Double maxGrade) {
        MoodleQuizAttemptsResponse attemptsResp = moodleWebService.getQuizUserAttempts(moodleToken, quizId, moodleUserId);

        int attemptsCount = 0;
        boolean isGiven = false;
        Double bestGrade = null;
        Instant completedAt = null;

        if (attemptsResp != null && attemptsResp.getAttempts() != null && !attemptsResp.getAttempts().isEmpty()) {
            attemptsCount = attemptsResp.getAttempts().size();
            for (MoodleQuizAttempt attempt : attemptsResp.getAttempts()) {
                boolean finished = "finished".equalsIgnoreCase(attempt.getState())
                        || (attempt.getTimefinish() != null && attempt.getTimefinish() > 0);

                if (finished) {
                    isGiven = true;
                    if (attempt.getTimefinish() != null && attempt.getTimefinish() > 0) {
                        Instant finishTime = Instant.ofEpochSecond(attempt.getTimefinish());
                        if (completedAt == null || finishTime.isAfter(completedAt)) {
                            completedAt = finishTime;
                        }
                    }
                    if (attempt.getSumgrades() != null) {
                        if (bestGrade == null || attempt.getSumgrades() > bestGrade) {
                            bestGrade = attempt.getSumgrades();
                        }
                    }
                }
            }
        }

        // Verify/fetch official best grade if user ID is available
        if (moodleUserId > 0) {
            try {
                com.klu.assignmenttracker.dto.moodle.MoodleQuizBestGradeResponse bestGradeResp =
                        moodleWebService.getQuizUserBestGrade(moodleToken, quizId, moodleUserId);
                if (bestGradeResp != null && Boolean.TRUE.equals(bestGradeResp.getHasgrade()) && bestGradeResp.getGrade() != null) {
                    bestGrade = bestGradeResp.getGrade();
                    isGiven = true;
                }
            } catch (Exception e) {
                log.debug("Best grade lookup for quizId={} ignored: {}", quizId, e.getMessage());
            }
        }

        if (isGiven) {
            return new ExamStatusInfo(ExamStatus.GIVEN, bestGrade, attemptsCount, completedAt);
        }

        Instant now = Instant.now();

        // Check if quiz has a future start date -> UPCOMING
        if (openDate != null && openDate.isAfter(now)) {
            return new ExamStatusInfo(ExamStatus.UPCOMING, null, attemptsCount, null);
        }

        // If not completed, check if close deadline has passed -> OVERDUE
        if (closeDate != null && closeDate.isBefore(now)) {
            return new ExamStatusInfo(ExamStatus.OVERDUE, null, attemptsCount, null);
        }

        // Available with future deadline or no deadline -> PENDING
        return new ExamStatusInfo(ExamStatus.PENDING, null, attemptsCount, null);
    }

    private record ExamStatusInfo(ExamStatus status, Double obtainedGrade, Integer attemptsCount, Instant completedAt) {}

    private Instant parseTimestamp(Long epochSeconds) {
        if (epochSeconds == null || epochSeconds <= 0) {
            return null;
        }
        return Instant.ofEpochSecond(epochSeconds);
    }

    private String stripHtml(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }
        // Basic HTML cleanup: replace <br>, <p> with newlines, remove tags, decode basic entities
        return html
                .replaceAll("(?i)<br\\s*/?>", "\n")
                .replaceAll("(?i)</p>", "\n")
                .replaceAll("<[^>]*>", "")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .trim();
    }
}

