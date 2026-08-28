package com.klu.assignmenttracker;

import com.klu.assignmenttracker.repository.AssignmentRepository;
import com.klu.assignmenttracker.repository.CourseRepository;
import com.klu.assignmenttracker.repository.SyncLogRepository;
import com.klu.assignmenttracker.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/**
 * Integration test that loads the full Spring application context.
 * All MongoDB repositories are mocked with Mockito, so no real database
 * connection is required to run this test.
 */
@SpringBootTest
@TestPropertySource(properties = {
    "app.jwt.secret=test-jwt-secret-key-that-is-long-enough-for-testing",
    "app.jwt.expiration-ms=86400000",
    "app.lms.token-url=https://lms.kluniversity.in/login/token.php",
    "app.lms.rest-url=https://lms.kluniversity.in/webservice/rest/server.php",
    "app.lms.service=moodle_mobile_app"
})
class AssignmentTrackerApplicationTests {

    // Mock all MongoDB repositories so Spring context loads without a real database
    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private CourseRepository courseRepository;

    @MockitoBean
    private AssignmentRepository assignmentRepository;

    @MockitoBean
    private SyncLogRepository syncLogRepository;

    @MockitoBean
    private com.klu.assignmenttracker.repository.PushSubscriptionRepository pushSubscriptionRepository;

    @MockitoBean
    private com.klu.assignmenttracker.repository.NotificationPreferencesRepository notificationPreferencesRepository;

    @MockitoBean
    private com.klu.assignmenttracker.repository.SentNotificationRepository sentNotificationRepository;

    /**
     * Verifies that the entire Spring application context starts up
     * without errors. This validates all beans, configurations, and
     * dependencies are correctly wired together.
     */
    @Test
    void contextLoads() {
        // If the context loads without exceptions, this test passes.
    }

}
