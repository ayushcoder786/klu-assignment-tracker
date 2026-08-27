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
import com.klu.assignmenttracker.repository.SyncLogRepository;
import com.klu.assignmenttracker.repository.UserRepository;
import com.klu.assignmenttracker.security.MoodleTokenCache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
    }
}
