package com.klu.assignmenttracker;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.klu.assignmenttracker.dto.NotificationPreferencesDto;
import com.klu.assignmenttracker.dto.PushSubscriptionRequest;
import com.klu.assignmenttracker.model.*;
import com.klu.assignmenttracker.repository.*;
import com.klu.assignmenttracker.security.JwtTokenProvider;
import com.klu.assignmenttracker.security.MoodleTokenCache;
import com.klu.assignmenttracker.service.NotificationDispatchService;
import com.klu.assignmenttracker.service.NotificationSchedulerService;
import com.klu.assignmenttracker.service.SyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "app.sync.initial-delay-ms=3600000",
        "app.push.vapid-public-key=BHcQuwpZvXy61nwpsqsi_QjaTnVJZ_7WpsIEhYiACsu4PgZ5n2uE0bS3QsuoZeG5OmWo3KMtuVUmSnwTXdigxaI",
        "app.push.vapid-private-key=bVVqoIRkNZ0TjwmBkcSJhRyAOEKNr_WxnlHCkbXSZDc",
        "app.push.subject=mailto:test@example.com"
})
public class Milestone5IntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private PushSubscriptionRepository pushSubscriptionRepository;

    @Autowired
    private NotificationPreferencesRepository preferencesRepository;

    @Autowired
    private SentNotificationRepository sentNotificationRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private MoodleTokenCache moodleTokenCache;

    @Autowired
    private NotificationDispatchService notificationDispatchService;

    @Autowired
    private NotificationSchedulerService notificationSchedulerService;

    @MockitoBean
    private SyncService syncService;

    private User testStudent;
    private String jwtToken;

    @BeforeEach
    void setup() {
        this.mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity())
                .build();

        // Clean up any previous test subscriptions/preferences
        pushSubscriptionRepository.deleteAll();
        preferencesRepository.deleteAll();
        sentNotificationRepository.deleteAll();
        assignmentRepository.deleteAll();

        testStudent = userRepository.findByStudentId("2200039999").orElseGet(() -> {
            User u = User.builder()
                    .studentId("2200039999")
                    .name("Integration Test Student")
                    .role(Role.STUDENT)
                    .build();
            return userRepository.save(u);
        });

        jwtToken = jwtTokenProvider.generateToken(testStudent.getStudentId());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. VAPID Configuration & Public Key Endpoint
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("1. VAPID public key endpoint should be public and return non-null key")
    void testVapidPublicKeyEndpoint() throws Exception {
        mockMvc.perform(get("/api/notifications/vapid-public-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicKey").exists());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Notification API: Subscribe, Status, Preferences, Unsubscribe
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("2. Full Notification API flow: Subscribe -> Status -> Preferences -> Unsubscribe")
    void testNotificationApiFullFlow() throws Exception {
        // 2a. Check initial status -> not subscribed
        mockMvc.perform(get("/api/notifications/status")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribed").value(false));

        // 2b. Subscribe
        PushSubscriptionRequest subReq = new PushSubscriptionRequest();
        subReq.setEndpoint("https://fcm.googleapis.com/fcm/send/test-endpoint-123");
        subReq.setP256dh("BEtRjNT_test_p256dh_key_data");
        subReq.setAuth("test_auth_secret");

        mockMvc.perform(post("/api/notifications/subscribe")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(subReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Push subscription saved successfully."));

        // Verify saved in MongoDB
        List<PushSubscription> subs = pushSubscriptionRepository.findByUserIdAndEnabledTrue(testStudent.getId());
        assertThat(subs).hasSize(1);
        assertThat(subs.get(0).getEndpoint()).isEqualTo("https://fcm.googleapis.com/fcm/send/test-endpoint-123");

        // 2c. Status should now be subscribed
        mockMvc.perform(get("/api/notifications/status")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribed").value(true));

        // 2d. Get Preferences (should return default all-true preferences)
        mockMvc.perform(get("/api/notifications/preferences")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.newAssignment").value(true))
                .andExpect(jsonPath("$.dueTomorrow").value(true))
                .andExpect(jsonPath("$.dueToday").value(true))
                .andExpect(jsonPath("$.overdue").value(true))
                .andExpect(jsonPath("$.deadlineChanged").value(true));

        // 2e. Update Preferences (turn off dueTomorrow)
        NotificationPreferencesDto updateDto = NotificationPreferencesDto.builder()
                .newAssignment(true)
                .dueTomorrow(false)
                .dueToday(true)
                .overdue(true)
                .deadlineChanged(true)
                .build();

        mockMvc.perform(put("/api/notifications/preferences")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueTomorrow").value(false));

        // Verify preferences updated in DB
        NotificationPreferences savedPrefs = preferencesRepository.findByUserId(testStudent.getId()).orElseThrow();
        assertThat(savedPrefs.isDueTomorrow()).isFalse();

        // 2f. Unsubscribe
        mockMvc.perform(delete("/api/notifications/subscribe")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("endpoint", "https://fcm.googleapis.com/fcm/send/test-endpoint-123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Push subscription removed."));

        // Verify removed from MongoDB
        assertThat(pushSubscriptionRepository.findByUserIdAndEnabledTrue(testStudent.getId())).isEmpty();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Test All 5 Notification Types + Deduplication
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("3. Notification Dispatch: Test all 5 types and MongoDB deduplication")
    void testAllNotificationTypesAndDeduplication() {
        // Create 5 assignments corresponding to the 5 notification types
        Instant now = Instant.now();

        // Type 1: NEW ASSIGNMENT (first seen 2 min ago, within syncWindow)
        Assignment newAssign = Assignment.builder()
                .userId(testStudent.getId())
                .title("New Java Assignment")
                .courseName("Java Programming")
                .status(AssignmentStatus.PENDING)
                .firstSeen(now.minus(2, ChronoUnit.MINUTES))
                .build();
        newAssign = assignmentRepository.save(newAssign);

        // Type 2: DUE TOMORROW (due in 24 hours)
        Assignment dueTomorrowAssign = Assignment.builder()
                .userId(testStudent.getId())
                .title("OS Project Due Tomorrow")
                .courseName("Operating Systems")
                .status(AssignmentStatus.PENDING)
                .dueDate(now.plus(24, ChronoUnit.HOURS))
                .firstSeen(now.minus(5, ChronoUnit.DAYS))
                .build();
        dueTomorrowAssign = assignmentRepository.save(dueTomorrowAssign);

        // Type 3: DUE TODAY (due in 8 hours)
        Assignment dueTodayAssign = Assignment.builder()
                .userId(testStudent.getId())
                .title("DBMS Lab Due Today")
                .courseName("Database Systems")
                .status(AssignmentStatus.PENDING)
                .dueDate(now.plus(8, ChronoUnit.HOURS))
                .firstSeen(now.minus(5, ChronoUnit.DAYS))
                .build();
        dueTodayAssign = assignmentRepository.save(dueTodayAssign);

        // Type 4: OVERDUE (past due date, status OVERDUE)
        Assignment overdueAssign = Assignment.builder()
                .userId(testStudent.getId())
                .title("Compiler Design Overdue")
                .courseName("Compiler Design")
                .status(AssignmentStatus.OVERDUE)
                .dueDate(now.minus(4, ChronoUnit.HOURS))
                .firstSeen(now.minus(5, ChronoUnit.DAYS))
                .build();
        overdueAssign = assignmentRepository.save(overdueAssign);

        // Type 5: DEADLINE CHANGED setup
        // Simulate a previously sent DUE_TOMORROW record with old date
        String oldDueDateStr = now.plus(1, ChronoUnit.DAYS).toString();
        SentNotification prevSent = SentNotification.builder()
                .userId(testStudent.getId())
                .assignmentId("assign-changed-1")
                .notificationType(NotificationType.DUE_TOMORROW)
                .dueDateVersion(oldDueDateStr)
                .sentAt(now.minus(1, ChronoUnit.DAYS))
                .build();
        sentNotificationRepository.save(prevSent);

        Assignment changedAssign = Assignment.builder()
                .id("assign-changed-1")
                .userId(testStudent.getId())
                .title("Networks Lab")
                .courseName("Computer Networks")
                .status(AssignmentStatus.PENDING)
                .dueDate(now.plus(3, ChronoUnit.DAYS)) // New extended deadline
                .firstSeen(now.minus(5, ChronoUnit.DAYS))
                .build();
        assignmentRepository.save(changedAssign);

        // Run dispatch
        notificationDispatchService.dispatchForUser(testStudent.getId(), now, 30);

        // Verify sent_notifications entries
        List<SentNotification> sentList = sentNotificationRepository.findAll();
        assertThat(sentList).isNotEmpty();

        boolean hasNew = sentList.stream().anyMatch(s -> s.getNotificationType() == NotificationType.NEW_ASSIGNMENT);
        boolean hasDueTomorrow = sentList.stream().anyMatch(s -> s.getNotificationType() == NotificationType.DUE_TOMORROW);
        boolean hasDueToday = sentList.stream().anyMatch(s -> s.getNotificationType() == NotificationType.DUE_TODAY);
        boolean hasOverdue = sentList.stream().anyMatch(s -> s.getNotificationType() == NotificationType.OVERDUE);
        boolean hasChanged = sentList.stream().anyMatch(s -> s.getNotificationType() == NotificationType.DEADLINE_CHANGED);

        assertThat(hasNew).as("NEW_ASSIGNMENT should be recorded").isTrue();
        assertThat(hasDueTomorrow).as("DUE_TOMORROW should be recorded").isTrue();
        assertThat(hasDueToday).as("DUE_TODAY should be recorded").isTrue();
        assertThat(hasOverdue).as("OVERDUE should be recorded").isTrue();
        assertThat(hasChanged).as("DEADLINE_CHANGED should be recorded").isTrue();

        int initialSentCount = sentList.size();

        // ── 4. Deduplication test ─────────────────────────────────────────────
        // Re-run dispatch immediately -> NO new sent_notifications should be added
        notificationDispatchService.dispatchForUser(testStudent.getId(), now, 30);
        List<SentNotification> secondSentList = sentNotificationRepository.findAll();
        assertThat(secondSentList).hasSize(initialSentCount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Automatic Scheduler Test
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("4. NotificationSchedulerService should sync students with tokens and skip students without tokens")
    void testSchedulerService() {
        // Put active token for test student
        moodleTokenCache.storeToken(testStudent.getId(), "moodle-test-token-active");

        // Run scheduled sync
        notificationSchedulerService.runScheduledSync();

        // Verify syncUserAssignments was called for testStudent
        verify(syncService, atLeastOnce()).syncUserAssignments(eq(testStudent), eq("moodle-test-token-active"));

        // Evict token
        moodleTokenCache.evictToken(testStudent.getId());
        reset(syncService);

        // Re-run scheduled sync -> should safely skip student without crashing
        notificationSchedulerService.runScheduledSync();
        verify(syncService, never()).syncUserAssignments(any(), any());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Security & Privacy Guarantees
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("5. Security verification: User documents and API responses must never contain passwords or Moodle tokens")
    void testSecurityGuarantees() throws Exception {
        User userInDb = userRepository.findById(testStudent.getId()).orElseThrow();
        assertThat(userInDb.getPassword()).isNull();

        mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentId").value("2200039999"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.moodleToken").doesNotExist())
                .andExpect(jsonPath("$.token").doesNotExist());
    }
}
