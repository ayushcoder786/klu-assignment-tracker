package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.dto.NotificationPreferencesDto;
import com.klu.assignmenttracker.dto.PushSubscriptionRequest;
import com.klu.assignmenttracker.model.NotificationPreferences;
import com.klu.assignmenttracker.model.PushSubscription;
import com.klu.assignmenttracker.repository.NotificationPreferencesRepository;
import com.klu.assignmenttracker.repository.PushSubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Business logic for managing push subscriptions and notification preferences.
 *
 * <p>Security: userId is always resolved from the JWT principal in the controller,
 * never trusted from any client-supplied field.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final PushSubscriptionRepository subscriptionRepository;
    private final NotificationPreferencesRepository preferencesRepository;

    public NotificationService(
            PushSubscriptionRepository subscriptionRepository,
            NotificationPreferencesRepository preferencesRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.preferencesRepository = preferencesRepository;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Push Subscription Management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register or update a push subscription for the authenticated user.
     * If a subscription for the same endpoint already exists, it is updated.
     */
    public void subscribe(String userId, PushSubscriptionRequest request) {
        PushSubscription sub = subscriptionRepository
                .findByUserIdAndEndpoint(userId, request.getEndpoint())
                .orElseGet(() -> PushSubscription.builder()
                        .userId(userId)
                        .endpoint(request.getEndpoint())
                        .build());

        sub.setP256dh(request.getP256dh());
        sub.setAuth(request.getAuth());
        sub.setEnabled(true);
        sub.setUpdatedAt(LocalDateTime.now());

        subscriptionRepository.save(sub);
        log.info("Push subscription saved for userId={}", userId);
    }

    /**
     * Remove a push subscription by endpoint.
     */
    public void unsubscribe(String userId, String endpoint) {
        subscriptionRepository.deleteByUserIdAndEndpoint(userId, endpoint);
        log.info("Push subscription removed for userId={}", userId);
    }

    /**
     * Check if the user has any active subscriptions.
     */
    public boolean hasActiveSubscription(String userId) {
        return subscriptionRepository.countByUserId(userId) > 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Notification Preferences
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get notification preferences for the authenticated user.
     * Creates a default preferences document if none exists yet.
     */
    public NotificationPreferencesDto getPreferences(String userId) {
        NotificationPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> {
                    NotificationPreferences defaultPrefs = NotificationPreferences.builder()
                            .userId(userId)
                            .build();
                    return preferencesRepository.save(defaultPrefs);
                });
        return NotificationPreferencesDto.from(prefs);
    }

    /**
     * Update notification preferences for the authenticated user.
     */
    public NotificationPreferencesDto updatePreferences(String userId, NotificationPreferencesDto dto) {
        NotificationPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> NotificationPreferences.builder().userId(userId).build());

        prefs.setNewAssignment(dto.isNewAssignment());
        prefs.setDueTomorrow(dto.isDueTomorrow());
        prefs.setDueToday(dto.isDueToday());
        prefs.setOverdue(dto.isOverdue());
        prefs.setDeadlineChanged(dto.isDeadlineChanged());
        prefs.setUpdatedAt(LocalDateTime.now());

        NotificationPreferences saved = preferencesRepository.save(prefs);
        log.info("Notification preferences updated for userId={}", userId);
        return NotificationPreferencesDto.from(saved);
    }
}
