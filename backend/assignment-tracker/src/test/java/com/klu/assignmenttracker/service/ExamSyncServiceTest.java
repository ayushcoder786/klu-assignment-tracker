package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.dto.SyncResponse;
import com.klu.assignmenttracker.dto.moodle.*;
import com.klu.assignmenttracker.model.*;
import com.klu.assignmenttracker.repository.AssignmentRepository;
import com.klu.assignmenttracker.repository.CourseRepository;
import com.klu.assignmenttracker.repository.ExamRepository;
import com.klu.assignmenttracker.repository.SyncLogRepository;
import com.klu.assignmenttracker.repository.UserRepository;
import com.klu.assignmenttracker.security.MoodleTokenCache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExamSyncServiceTest {

    @Mock
    private SyncLogRepository syncLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private AssignmentRepository assignmentRepository;

    @Mock
    private ExamRepository examRepository;

    @Mock
    private MoodleWebService moodleWebService;

    @Mock
    private MoodleTokenCache moodleTokenCache;

    private SyncService syncService;

    @BeforeEach
    void setUp() {
        syncService = new SyncService(
                syncLogRepository,
                userRepository,
                courseRepository,
                assignmentRepository,
                examRepository,
                moodleWebService,
                moodleTokenCache
        );
    }

    private User setupUserAndCommonMocks() {
        User user = User.builder()
                .id("user-123")
                .studentId("2200030001")
                .role(Role.STUDENT)
                .build();

        SyncLog dummyLog = SyncLog.builder()
                .id("log-1")
                .userId(user.getId())
                .status(SyncStatus.RUNNING)
                .build();
        when(syncLogRepository.save(any(SyncLog.class))).thenReturn(dummyLog);

        MoodleSiteInfo siteInfo = MoodleSiteInfo.builder()
                .userid(9999L)
                .fullname("Test Student")
                .build();
        when(moodleWebService.getSiteInfo("valid-token")).thenReturn(siteInfo);

        MoodleCourse course = MoodleCourse.builder()
                .id(101L)
                .fullname("Design and Analysis of Algorithms")
                .shortname("DAA")
                .build();
        when(moodleWebService.getEnrolledCourses("valid-token", 9999L))
                .thenReturn(List.of(course));

        Course savedCourse = Course.builder()
                .id("course-101")
                .userId(user.getId())
                .moodleCourseId("101")
                .name("Design and Analysis of Algorithms")
                .shortName("DAA")
                .build();
        when(courseRepository.findByUserIdAndMoodleCourseId(user.getId(), "101"))
                .thenReturn(Optional.of(savedCourse));
        when(courseRepository.save(any(Course.class))).thenReturn(savedCourse);

        when(moodleWebService.getAssignments("valid-token", List.of(101L)))
                .thenReturn(MoodleAssignmentsResponse.builder().courses(List.of()).build());

        when(userRepository.save(any(User.class))).thenReturn(user);

        return user;
    }

    @Test
    @DisplayName("1. Completed/Given Exam: Detects finished attempt and captures grade and status GIVEN")
    void testSyncExams_GivenCompleted() {
        User user = setupUserAndCommonMocks();

        long nowSec = Instant.now().getEpochSecond();
        MoodleQuizItem quizItem = MoodleQuizItem.builder()
                .id(701L)
                .course(101L)
                .coursemodule(901L)
                .name("DAA Mid-1 E-Exam")
                .intro("<p>Instructions</p>")
                .timeopen(nowSec - 7200)
                .timeclose(nowSec + 3600)
                .timelimit(3600L)
                .attempts(2)
                .grade(20.0)
                .visible(1)
                .build();

        when(moodleWebService.getQuizzes("valid-token", List.of(101L)))
                .thenReturn(MoodleQuizzesResponse.builder().quizzes(List.of(quizItem)).build());

        MoodleQuizAttempt attempt = MoodleQuizAttempt.builder()
                .id(1001L)
                .quiz(701L)
                .attempt(1)
                .state("finished")
                .timestart(nowSec - 5000)
                .timefinish(nowSec - 2000)
                .sumgrades(18.5)
                .build();

        when(moodleWebService.getQuizUserAttempts("valid-token", 701L))
                .thenReturn(MoodleQuizAttemptsResponse.builder().attempts(List.of(attempt)).build());

        when(examRepository.findByUserIdAndMoodleQuizId(user.getId(), "701"))
                .thenReturn(Optional.empty());

        SyncResponse response = syncService.syncUserAssignments(user, "valid-token");

        assertNotNull(response);
        ArgumentCaptor<Exam> examCaptor = ArgumentCaptor.forClass(Exam.class);
        verify(examRepository).save(examCaptor.capture());

        Exam savedExam = examCaptor.getValue();
        assertEquals("701", savedExam.getMoodleQuizId());
        assertEquals("901", savedExam.getCourseModuleId());
        assertEquals("DAA Mid-1 E-Exam", savedExam.getTitle());
        assertEquals(ExamStatus.GIVEN, savedExam.getStatus(), "Status must be GIVEN when student has completed the attempt");
        assertEquals(18.5, savedExam.getObtainedGrade(), "Score must match attempt score");
        assertEquals(20.0, savedExam.getMaxGrade());
        assertEquals("https://lms.kluniversity.in/mod/quiz/view.php?id=901", savedExam.getLmsUrl());
        assertEquals(1, savedExam.getAttemptsCount());
        assertNotNull(savedExam.getCompletedAt());
    }

    @Test
    @DisplayName("2. Pending Exam: Future deadline and not yet attempted -> status PENDING")
    void testSyncExams_Pending() {
        User user = setupUserAndCommonMocks();

        long nowSec = Instant.now().getEpochSecond();
        MoodleQuizItem quizItem = MoodleQuizItem.builder()
                .id(702L)
                .course(101L)
                .coursemodule(902L)
                .name("DAA Quiz 2")
                .timeopen(nowSec - 1000)
                .timeclose(nowSec + 86400) // tomorrow
                .timelimit(1800L)
                .grade(10.0)
                .visible(1)
                .build();

        when(moodleWebService.getQuizzes("valid-token", List.of(101L)))
                .thenReturn(MoodleQuizzesResponse.builder().quizzes(List.of(quizItem)).build());

        when(moodleWebService.getQuizUserAttempts("valid-token", 702L))
                .thenReturn(MoodleQuizAttemptsResponse.builder().attempts(List.of()).build());

        when(examRepository.findByUserIdAndMoodleQuizId(user.getId(), "702"))
                .thenReturn(Optional.empty());

        syncService.syncUserAssignments(user, "valid-token");

        ArgumentCaptor<Exam> examCaptor = ArgumentCaptor.forClass(Exam.class);
        verify(examRepository).save(examCaptor.capture());

        Exam savedExam = examCaptor.getValue();
        assertEquals(ExamStatus.PENDING, savedExam.getStatus(), "Status must be PENDING when deadline is in the future");
        assertNull(savedExam.getObtainedGrade());
        assertEquals(0, savedExam.getAttemptsCount());
    }

    @Test
    @DisplayName("3. Overdue Exam: Past deadline and not attempted -> status OVERDUE")
    void testSyncExams_Overdue() {
        User user = setupUserAndCommonMocks();

        long nowSec = Instant.now().getEpochSecond();
        MoodleQuizItem quizItem = MoodleQuizItem.builder()
                .id(703L)
                .course(101L)
                .coursemodule(903L)
                .name("DAA Quiz 1 (Past)")
                .timeopen(nowSec - 86400 * 3)
                .timeclose(nowSec - 86400) // closed yesterday
                .timelimit(1800L)
                .grade(10.0)
                .visible(1)
                .build();

        when(moodleWebService.getQuizzes("valid-token", List.of(101L)))
                .thenReturn(MoodleQuizzesResponse.builder().quizzes(List.of(quizItem)).build());

        when(moodleWebService.getQuizUserAttempts("valid-token", 703L))
                .thenReturn(MoodleQuizAttemptsResponse.builder().attempts(List.of()).build());

        when(examRepository.findByUserIdAndMoodleQuizId(user.getId(), "703"))
                .thenReturn(Optional.empty());

        syncService.syncUserAssignments(user, "valid-token");

        ArgumentCaptor<Exam> examCaptor = ArgumentCaptor.forClass(Exam.class);
        verify(examRepository).save(examCaptor.capture());

        Exam savedExam = examCaptor.getValue();
        assertEquals(ExamStatus.OVERDUE, savedExam.getStatus(), "Status must be OVERDUE when close deadline has passed without completion");
    }

    @Test
    @DisplayName("4. Exam without deadline (timeclose=0): Handled safely as PENDING, never marked OVERDUE")
    void testSyncExams_NoDeadline() {
        User user = setupUserAndCommonMocks();

        long nowSec = Instant.now().getEpochSecond();
        MoodleQuizItem quizItem = MoodleQuizItem.builder()
                .id(704L)
                .course(101L)
                .name("Self-Assessment Practice Test")
                .timeopen(nowSec - 86400)
                .timeclose(0L) // No deadline
                .visible(1)
                .build();

        when(moodleWebService.getQuizzes("valid-token", List.of(101L)))
                .thenReturn(MoodleQuizzesResponse.builder().quizzes(List.of(quizItem)).build());

        when(moodleWebService.getQuizUserAttempts("valid-token", 704L))
                .thenReturn(MoodleQuizAttemptsResponse.builder().attempts(List.of()).build());

        when(examRepository.findByUserIdAndMoodleQuizId(user.getId(), "704"))
                .thenReturn(Optional.empty());

        syncService.syncUserAssignments(user, "valid-token");

        ArgumentCaptor<Exam> examCaptor = ArgumentCaptor.forClass(Exam.class);
        verify(examRepository).save(examCaptor.capture());

        Exam savedExam = examCaptor.getValue();
        assertEquals(ExamStatus.PENDING, savedExam.getStatus(), "Exams without deadline must remain PENDING and never OVERDUE");
        assertNull(savedExam.getCloseDate());
    }

    @Test
    @DisplayName("5. Upcoming Exam: timeopen in future is safely marked PENDING")
    void testSyncExams_Upcoming() {
        User user = setupUserAndCommonMocks();

        long nowSec = Instant.now().getEpochSecond();
        MoodleQuizItem quizItem = MoodleQuizItem.builder()
                .id(705L)
                .course(101L)
                .name("Comprehensive Final Exam")
                .timeopen(nowSec + 86400 * 5) // opens in 5 days
                .timeclose(nowSec + 86400 * 6)
                .visible(1)
                .build();

        when(moodleWebService.getQuizzes("valid-token", List.of(101L)))
                .thenReturn(MoodleQuizzesResponse.builder().quizzes(List.of(quizItem)).build());

        when(moodleWebService.getQuizUserAttempts("valid-token", 705L))
                .thenReturn(MoodleQuizAttemptsResponse.builder().attempts(List.of()).build());

        when(examRepository.findByUserIdAndMoodleQuizId(user.getId(), "705"))
                .thenReturn(Optional.empty());

        syncService.syncUserAssignments(user, "valid-token");

        ArgumentCaptor<Exam> examCaptor = ArgumentCaptor.forClass(Exam.class);
        verify(examRepository).save(examCaptor.capture());

        Exam savedExam = examCaptor.getValue();
        assertEquals(ExamStatus.PENDING, savedExam.getStatus());
        assertTrue(savedExam.getOpenDate().isAfter(Instant.now()));
    }

    @Test
    @DisplayName("6. Duplicate Prevention: Existing exam document is updated upon re-syncing")
    void testSyncExams_DuplicatePrevention() {
        User user = setupUserAndCommonMocks();

        long nowSec = Instant.now().getEpochSecond();
        MoodleQuizItem quizItem = MoodleQuizItem.builder()
                .id(706L)
                .course(101L)
                .name("Updated Title Test")
                .timeclose(nowSec + 3600)
                .visible(1)
                .build();

        when(moodleWebService.getQuizzes("valid-token", List.of(101L)))
                .thenReturn(MoodleQuizzesResponse.builder().quizzes(List.of(quizItem)).build());

        when(moodleWebService.getQuizUserAttempts("valid-token", 706L))
                .thenReturn(MoodleQuizAttemptsResponse.builder().attempts(List.of()).build());

        Exam existingExam = Exam.builder()
                .id("db-exam-706")
                .userId(user.getId())
                .moodleQuizId("706")
                .title("Old Title Test")
                .firstSeen(Instant.now().minusSeconds(86400))
                .build();

        when(examRepository.findByUserIdAndMoodleQuizId(user.getId(), "706"))
                .thenReturn(Optional.of(existingExam));

        syncService.syncUserAssignments(user, "valid-token");

        ArgumentCaptor<Exam> examCaptor = ArgumentCaptor.forClass(Exam.class);
        verify(examRepository).save(examCaptor.capture());

        Exam savedExam = examCaptor.getValue();
        assertEquals("db-exam-706", savedExam.getId(), "Existing document ID must be preserved");
        assertEquals("Updated Title Test", savedExam.getTitle(), "Title should be updated");
    }

    @Test
    @DisplayName("7. Multiple attempts: Selects highest score and correctly counts attempts")
    void testSyncExams_MultipleAttempts() {
        User user = setupUserAndCommonMocks();

        long nowSec = Instant.now().getEpochSecond();
        MoodleQuizItem quizItem = MoodleQuizItem.builder()
                .id(707L)
                .course(101L)
                .name("Retake Allowed Quiz")
                .timeclose(nowSec + 3600)
                .attempts(3)
                .grade(20.0)
                .visible(1)
                .build();

        when(moodleWebService.getQuizzes("valid-token", List.of(101L)))
                .thenReturn(MoodleQuizzesResponse.builder().quizzes(List.of(quizItem)).build());

        MoodleQuizAttempt attempt1 = MoodleQuizAttempt.builder()
                .id(101L)
                .attempt(1)
                .state("finished")
                .timefinish(nowSec - 5000)
                .sumgrades(12.0)
                .build();

        MoodleQuizAttempt attempt2 = MoodleQuizAttempt.builder()
                .id(102L)
                .attempt(2)
                .state("finished")
                .timefinish(nowSec - 1000)
                .sumgrades(19.0) // Higher score on retake
                .build();

        when(moodleWebService.getQuizUserAttempts("valid-token", 707L))
                .thenReturn(MoodleQuizAttemptsResponse.builder().attempts(List.of(attempt1, attempt2)).build());

        when(examRepository.findByUserIdAndMoodleQuizId(user.getId(), "707"))
                .thenReturn(Optional.empty());

        syncService.syncUserAssignments(user, "valid-token");

        ArgumentCaptor<Exam> examCaptor = ArgumentCaptor.forClass(Exam.class);
        verify(examRepository).save(examCaptor.capture());

        Exam savedExam = examCaptor.getValue();
        assertEquals(ExamStatus.GIVEN, savedExam.getStatus());
        assertEquals(19.0, savedExam.getObtainedGrade(), "Best attempt grade must be recorded");
        assertEquals(2, savedExam.getAttemptsCount());
    }

    @Test
    @DisplayName("8. Fault tolerance: LMS exception during quiz retrieval does not abort overall sync")
    void testSyncExams_LmsErrorHandledGracefully() {
        User user = setupUserAndCommonMocks();

        when(moodleWebService.getQuizzes("valid-token", List.of(101L)))
                .thenThrow(new RuntimeException("Quiz API timeout"));

        SyncResponse response = syncService.syncUserAssignments(user, "valid-token");

        assertNotNull(response);
        // User sync should complete successfully for courses & assignments without crashing
        assertNotNull(user.getLastSync());
        verify(userRepository).save(user);
    }
}
