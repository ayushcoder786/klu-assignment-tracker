package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.dto.SyncResponse;
import com.klu.assignmenttracker.dto.moodle.MoodleAssignmentCourse;
import com.klu.assignmenttracker.dto.moodle.MoodleAssignmentItem;
import com.klu.assignmenttracker.dto.moodle.MoodleAssignmentsResponse;
import com.klu.assignmenttracker.dto.moodle.MoodleCourse;
import com.klu.assignmenttracker.dto.moodle.MoodleSiteInfo;
import com.klu.assignmenttracker.model.Assignment;
import com.klu.assignmenttracker.model.Course;
import com.klu.assignmenttracker.model.Role;
import com.klu.assignmenttracker.model.SyncLog;
import com.klu.assignmenttracker.model.SyncStatus;
import com.klu.assignmenttracker.model.User;
import com.klu.assignmenttracker.repository.AssignmentRepository;
import com.klu.assignmenttracker.repository.CourseRepository;
import com.klu.assignmenttracker.repository.ExamRepository;
import com.klu.assignmenttracker.repository.SyncLogRepository;
import com.klu.assignmenttracker.repository.UserRepository;
import com.klu.assignmenttracker.security.MoodleTokenCache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SyncServiceTest {

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

    @Test
    void testSyncUserAssignments_Success() {
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

        MoodleAssignmentItem item = MoodleAssignmentItem.builder()
                .id(501L)
                .name("Lab Assessment 1")
                .intro("<p>Submit before deadline</p>")
                .duedate(System.currentTimeMillis() / 1000 + 86400) // tomorrow
                .build();

        MoodleAssignmentCourse mac = MoodleAssignmentCourse.builder()
                .id(101L)
                .fullname("Design and Analysis of Algorithms")
                .assignments(List.of(item))
                .build();

        MoodleAssignmentsResponse assignmentsResponse = MoodleAssignmentsResponse.builder()
                .courses(List.of(mac))
                .build();

        when(moodleWebService.getAssignments("valid-token", List.of(101L)))
                .thenReturn(assignmentsResponse);

        when(assignmentRepository.findByUserIdAndMoodleAssignmentId(user.getId(), "501"))
                .thenReturn(Optional.empty());

        when(userRepository.save(any(User.class))).thenReturn(user);

        SyncResponse response = syncService.syncUserAssignments(user, "valid-token");

        assertNotNull(response);
        verify(courseRepository).save(any(Course.class));
        verify(assignmentRepository).save(any(Assignment.class));
        verify(userRepository).save(any(User.class));
        assertEquals("Test Student", user.getName());
        assertNotNull(user.getLastSync(), "lastSync must be updated upon successful LMS sync");
    }

    @Test
    void testTriggerSync_WithCachedToken() {
        User user = User.builder()
                .id("user-123")
                .studentId("2200030001")
                .role(Role.STUDENT)
                .build();

        when(userRepository.findByStudentId("2200030001")).thenReturn(Optional.of(user));
        when(moodleTokenCache.getToken(user.getId())).thenReturn(Optional.of("cached-token"));

        SyncLog dummyLog = SyncLog.builder().id("log-1").userId(user.getId()).build();
        when(syncLogRepository.save(any(SyncLog.class))).thenReturn(dummyLog);

        MoodleSiteInfo siteInfo = MoodleSiteInfo.builder().userid(9999L).fullname("Test Student").build();
        when(moodleWebService.getSiteInfo("cached-token")).thenReturn(siteInfo);
        when(moodleWebService.getEnrolledCourses("cached-token", 9999L)).thenReturn(List.of());
        when(userRepository.save(any(User.class))).thenReturn(user);

        SyncResponse response = syncService.triggerSync("2200030001");
        assertNotNull(response);
        verify(moodleWebService).getSiteInfo("cached-token");
        assertNotNull(user.getLastSync(), "lastSync must be updated upon successful triggerSync");
    }

    @Test
    void testSyncUserAssignments_LmsUnavailable_PreservesPreviousLastSync() {
        Instant initialSync = Instant.parse("2026-08-01T10:00:00Z");
        User user = User.builder()
                .id("user-123")
                .studentId("2200030001")
                .role(Role.STUDENT)
                .lastSync(initialSync)
                .build();

        SyncLog dummyLog = SyncLog.builder().id("log-1").userId(user.getId()).build();
        when(syncLogRepository.save(any(SyncLog.class))).thenReturn(dummyLog);

        when(moodleWebService.getSiteInfo("failing-token"))
                .thenThrow(new com.klu.assignmenttracker.exception.LmsUnavailableException(
                        "KLU LMS is temporarily unavailable (external LMS database connection failed)."));

        SyncResponse response = syncService.syncUserAssignments(user, "failing-token");

        assertNotNull(response);
        assertEquals("LMS is temporarily unavailable. Please try syncing again later.", response.getMessage());
        // Verify lastSync was NOT modified or overwritten
        assertEquals(initialSync, user.getLastSync(), "Previous lastSync timestamp must be preserved on sync failure");
    }

    @Test
    void testGetAllSyncLogs_MapsStudentNameAndId() {
        User user1 = User.builder()
                .id("u1")
                .studentId("2500032102")
                .name("AYUSH KUMAR 2500032102")
                .role(Role.ADMIN)
                .build();

        User user2 = User.builder()
                .id("u2")
                .studentId("2200030001")
                .name("Rahul Sharma")
                .role(Role.STUDENT)
                .build();

        SyncLog log1 = SyncLog.builder()
                .id("log-1")
                .userId("u1")
                .status(SyncStatus.SUCCESS)
                .assignmentsFound(10)
                .startedAt(Instant.now())
                .build();

        SyncLog log2 = SyncLog.builder()
                .id("log-2")
                .userId("u2")
                .status(SyncStatus.SUCCESS)
                .assignmentsFound(5)
                .startedAt(Instant.now().minusSeconds(60))
                .build();

        SyncLog logOrphan = SyncLog.builder()
                .id("log-3")
                .userId("unknown-id")
                .status(SyncStatus.FAILED)
                .startedAt(Instant.now().minusSeconds(120))
                .build();

        when(userRepository.findAll()).thenReturn(List.of(user1, user2));
        when(syncLogRepository.findAllByOrderByStartedAtDesc()).thenReturn(List.of(log1, log2, logOrphan));

        List<com.klu.assignmenttracker.dto.SyncLogResponse> logs = syncService.getAllSyncLogs();

        assertNotNull(logs);
        assertEquals(3, logs.size());

        // First log
        assertEquals("log-1", logs.get(0).getId());
        assertEquals("2500032102", logs.get(0).getStudentId());
        assertEquals("AYUSH KUMAR 2500032102", logs.get(0).getStudentName());
        assertEquals("u1", logs.get(0).getUserId());

        // Second log
        assertEquals("log-2", logs.get(1).getId());
        assertEquals("2200030001", logs.get(1).getStudentId());
        assertEquals("Rahul Sharma", logs.get(1).getStudentName());

        // Orphaned log has fallback
        assertEquals("log-3", logs.get(2).getId());
        assertEquals("unknown-id", logs.get(2).getUserId());
    }

    @Test
    void testGetSyncLogsByUserId_MapsStudentNameAndId() {
        User user = User.builder()
                .id("u1")
                .studentId("2500032102")
                .name("Ayush Kumar")
                .build();

        SyncLog log = SyncLog.builder()
                .id("log-1")
                .userId("u1")
                .status(SyncStatus.SUCCESS)
                .build();

        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(syncLogRepository.findByUserIdOrderByStartedAtDesc("u1")).thenReturn(List.of(log));

        List<com.klu.assignmenttracker.dto.SyncLogResponse> logs = syncService.getSyncLogsByUserId("u1");

        assertNotNull(logs);
        assertEquals(1, logs.size());
        assertEquals("2500032102", logs.get(0).getStudentId());
        assertEquals("Ayush Kumar", logs.get(0).getStudentName());
    }
}
