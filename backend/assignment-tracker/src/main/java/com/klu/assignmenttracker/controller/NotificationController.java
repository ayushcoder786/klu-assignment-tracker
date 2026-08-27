package com.klu.assignmenttracker.controller;

import com.klu.assignmenttracker.dto.NotificationPreferencesDto;
import com.klu.assignmenttracker.dto.PushSubscriptionRequest;
import com.klu.assignmenttracker.service.NotificationService;
import com.klu.assignmenttracker.service.PushNotificationService;
import com.klu.assignmenttracker.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for Web Push notification subscriptions and preferences.
 *
 * <p>Security rules:
 * <ul>
 *   <li>The VAPID public key endpoint is PUBLIC (frontend needs it before auth).</li>
 *   <li>All other endpoints require a valid JWT — handled by the security filter chain.</li>
 *   <li>User identity is always resolved from the JWT principal, NEVER from any client-supplied field.</li>
 *   <li>The VAPID PRIVATE KEY is never returned by any endpoint.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final PushNotificationService pushNotificationService;
    private final UserService userService;

    public NotificationController(
            NotificationService notificationService,
            PushNotificationService pushNotificationService,
            UserService userService) {
        this.notificationService = notificationService;
        this.pushNotificationService = pushNotificationService;
        this.userService = userService;
    }

    /**
     * GET /api/notifications/vapid-public-key
     *
     * Returns the VAPID public key so the frontend can create a PushSubscription.
     * This endpoint is PUBLIC — it does not require authentication.
     * SECURITY: The PRIVATE key is NEVER returned here or anywhere else.
     */
    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> getVapidPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", pushNotificationService.getVapidPublicKey()));
    }

    /**
     * POST /api/notifications/subscribe
     *
     * Register a push subscription for the currently authenticated student.
     * Request body: { "endpoint": "...", "p256dh": "...", "auth": "..." }
     */
    @PostMapping("/subscribe")
    public ResponseEntity<Map<String, String>> subscribe(
            @Valid @RequestBody PushSubscriptionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = resolveUserId(userDetails);
        notificationService.subscribe(userId, request);
        return ResponseEntity.ok(Map.of("message", "Push subscription saved successfully."));
    }

    /**
     * DELETE /api/notifications/subscribe
     *
     * Remove the push subscription with the given endpoint for the authenticated student.
     * Request body: { "endpoint": "..." }
     */
    @DeleteMapping("/subscribe")
    public ResponseEntity<Map<String, String>> unsubscribe(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = resolveUserId(userDetails);
        String endpoint = body.get("endpoint");
        if (endpoint == null || endpoint.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "endpoint is required"));
        }
        notificationService.unsubscribe(userId, endpoint);
        return ResponseEntity.ok(Map.of("message", "Push subscription removed."));
    }

    /**
     * GET /api/notifications/preferences
     *
     * Retrieve the authenticated student's notification preferences.
     * Creates default preferences if none exist yet.
     */
    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferencesDto> getPreferences(
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = resolveUserId(userDetails);
        return ResponseEntity.ok(notificationService.getPreferences(userId));
    }

    /**
     * PUT /api/notifications/preferences
     *
     * Update the authenticated student's notification preferences.
     */
    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferencesDto> updatePreferences(
            @RequestBody NotificationPreferencesDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = resolveUserId(userDetails);
        return ResponseEntity.ok(notificationService.updatePreferences(userId, dto));
    }

    /**
     * GET /api/notifications/status
     *
     * Returns whether the student has an active push subscription.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = resolveUserId(userDetails);
        boolean hasSubscription = notificationService.hasActiveSubscription(userId);
        boolean pushConfigured = pushNotificationService.isConfigured();
        return ResponseEntity.ok(Map.of(
                "subscribed", hasSubscription,
                "pushServiceAvailable", pushConfigured
        ));
    }

    /**
     * POST /api/notifications/test-push
     *
     * Sends a real test push notification to the authenticated student's active push subscription.
     */
    @PostMapping("/test-push")
    public ResponseEntity<Map<String, String>> sendTestPush(
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = resolveUserId(userDetails);
        pushNotificationService.sendToUser(
                userId,
                "🔔 KLU Tracker Notification",
                "Your push notification setup is working successfully!",
                "test-assignment-id"
        );
        return ResponseEntity.ok(Map.of("message", "Test push notification sent."));
    }

    /**
     * Resolve the internal MongoDB user ID from the JWT principal.
     * The JWT subject is the studentId (or email for admins).
     * SECURITY: user ID is ALWAYS from the trusted JWT, never from client request body.
     */
    private String resolveUserId(UserDetails userDetails) {
        return userService.getUserBySubject(userDetails.getUsername()).getId();
    }
}
