package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.model.Assignment;
import com.klu.assignmenttracker.model.AssignmentStatus;
import com.klu.assignmenttracker.model.NotificationPreferences;
import com.klu.assignmenttracker.model.SentNotification;
import com.klu.assignmenttracker.repository.AssignmentRepository;
import com.klu.assignmenttracker.repository.NotificationPreferencesRepository;
import com.klu.assignmenttracker.repository.SentNotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link NotificationDispatchService}.
 *
 * All dependencies are mocked — no database or network required.
 */
@ExtendWith(MockitoExtension.class)
class NotificationDispatchServiceTest {

    @Mock private AssignmentRepository assignmentRepository;
    @Mock private NotificationPreferencesRepository preferencesRepository;
    @Mock private SentNotificationRepository sentNotificationRepository;
    @Mock private PushNotificationService pushNotificationService;

    private NotificationDispatchService dispatchService;

    private static final String USER_ID = "user123";
    private static final String ASSIGNMENT_ID = "assign456";

    @BeforeEach
    void setUp() {
        dispatchService = new NotificationDispatchService(
                assignmentRepository,
                preferencesRepository,
                sentNotificationRepository,
                pushNotificationService
        );
        // Push is configured by default in tests
        when(pushNotificationService.isConfigured()).thenReturn(true);
    }

    @Test
    @DisplayName("Should send NEW_ASSIGNMENT notification for recently discovered assignment")
    void shouldSendNewAssignmentNotification() {
        // Arrange
        NotificationPreferences prefs = NotificationPreferences.builder()
                .userId(USER_ID).newAssignment(true).build();
        when(preferencesRepository.findByUserId(USER_ID)).thenReturn(Optional.of(prefs));

        Assignment assignment = Assignment.builder()
                .id(ASSIGNMENT_ID)
                .userId(USER_ID)
                .title("Data Structures Assignment")
                .courseName("Data Structures")
                .status(AssignmentStatus.PENDING)
                .firstSeen(Instant.now().minus(5, ChronoUnit.MINUTES))  // Seen 5 min ago
                .build();
        when(assignmentRepository.findByUserId(USER_ID)).thenReturn(List.of(assignment));

        // Save succeeds (no duplicate)
        when(sentNotificationRepository.save(any(SentNotification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // Act
        dispatchService.dispatchForUser(USER_ID, Instant.now(), 30);

        // Assert
        ArgumentCaptor<String> titleCaptor = ArgumentCaptor.forClass(String.class);
        verify(pushNotificationService).sendToUser(eq(USER_ID), titleCaptor.capture(), anyString(), eq(ASSIGNMENT_ID));
        assertThat(titleCaptor.getValue()).contains("New Assignment");
    }

    @Test
    @DisplayName("Should send DUE_TOMORROW notification when assignment is due in ~24 hours")
    void shouldSendDueTomorrowNotification() {
        // Arrange
        NotificationPreferences prefs = NotificationPreferences.builder()
                .userId(USER_ID).dueTomorrow(true).build();
        when(preferencesRepository.findByUserId(USER_ID)).thenReturn(Optional.of(prefs));

        // Due in 23 hours — within 20-28 hour window
        Instant dueDate = Instant.now().plus(23, ChronoUnit.HOURS);
        Assignment assignment = Assignment.builder()
                .id(ASSIGNMENT_ID)
                .userId(USER_ID)
                .title("OS Lab Report")
                .courseName("Operating Systems")
                .status(AssignmentStatus.PENDING)
                .dueDate(dueDate)
                .firstSeen(Instant.now().minus(5, ChronoUnit.DAYS))  // Not "new"
                .build();
        when(assignmentRepository.findByUserId(USER_ID)).thenReturn(List.of(assignment));
        when(sentNotificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(sentNotificationRepository.findByUserIdAndAssignmentIdAndNotificationType(any(), any(), any()))
                .thenReturn(Optional.empty());

        // Act
        dispatchService.dispatchForUser(USER_ID, Instant.now(), 30);

        // Assert
        ArgumentCaptor<String> titleCaptor = ArgumentCaptor.forClass(String.class);
        verify(pushNotificationService).sendToUser(eq(USER_ID), titleCaptor.capture(), anyString(), eq(ASSIGNMENT_ID));
        assertThat(titleCaptor.getValue()).contains("Due Tomorrow");
    }

    @Test
    @DisplayName("Should NOT send duplicate notification when DuplicateKeyException is thrown")
    void shouldNotSendDuplicateNotification() {
        // Arrange
        NotificationPreferences prefs = NotificationPreferences.builder()
                .userId(USER_ID).overdue(true).build();
        when(preferencesRepository.findByUserId(USER_ID)).thenReturn(Optional.of(prefs));

        Instant overdueDate = Instant.now().minus(1, ChronoUnit.DAYS);
        Assignment assignment = Assignment.builder()
                .id(ASSIGNMENT_ID)
                .userId(USER_ID)
                .title("Math Assignment")
                .courseName("Mathematics")
                .status(AssignmentStatus.OVERDUE)
                .dueDate(overdueDate)
                .firstSeen(Instant.now().minus(10, ChronoUnit.DAYS))
                .build();
        when(assignmentRepository.findByUserId(USER_ID)).thenReturn(List.of(assignment));

        // Simulate duplicate — already sent
        when(sentNotificationRepository.save(any())).thenThrow(new DuplicateKeyException("duplicate"));

        // Act
        dispatchService.dispatchForUser(USER_ID, Instant.now(), 30);

        // Assert — push should NOT be called because save threw DuplicateKeyException
        verify(pushNotificationService, never()).sendToUser(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should skip dispatch when push is not configured")
    void shouldSkipWhenPushNotConfigured() {
        // Arrange
        when(pushNotificationService.isConfigured()).thenReturn(false);

        // Act
        dispatchService.dispatchForUser(USER_ID, Instant.now(), 30);

        // Assert — nothing should be called
        verifyNoInteractions(assignmentRepository, preferencesRepository, sentNotificationRepository);
    }

    @Test
    @DisplayName("Should send OVERDUE notification for overdue assignment")
    void shouldSendOverdueNotification() {
        // Arrange
        NotificationPreferences prefs = NotificationPreferences.builder()
                .userId(USER_ID).overdue(true).build();
        when(preferencesRepository.findByUserId(USER_ID)).thenReturn(Optional.of(prefs));

        Instant pastDue = Instant.now().minus(2, ChronoUnit.HOURS);
        Assignment assignment = Assignment.builder()
                .id(ASSIGNMENT_ID)
                .userId(USER_ID)
                .title("Physics Lab")
                .courseName("Physics")
                .status(AssignmentStatus.OVERDUE)
                .dueDate(pastDue)
                .firstSeen(Instant.now().minus(5, ChronoUnit.DAYS))
                .build();
        when(assignmentRepository.findByUserId(USER_ID)).thenReturn(List.of(assignment));
        when(sentNotificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(sentNotificationRepository.findByUserIdAndAssignmentIdAndNotificationType(any(), any(), any()))
                .thenReturn(Optional.empty());

        // Act
        dispatchService.dispatchForUser(USER_ID, Instant.now(), 30);

        // Assert
        ArgumentCaptor<String> titleCaptor = ArgumentCaptor.forClass(String.class);
        verify(pushNotificationService).sendToUser(eq(USER_ID), titleCaptor.capture(), anyString(), eq(ASSIGNMENT_ID));
        assertThat(titleCaptor.getValue()).contains("Overdue");
    }
}
