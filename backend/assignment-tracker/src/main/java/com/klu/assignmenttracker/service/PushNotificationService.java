package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.model.PushSubscription;
import com.klu.assignmenttracker.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.security.Security;
import java.util.List;

/**
 * Service for sending Web Push notifications via the VAPID protocol.
 *
 * <p>Security guarantees:
 * <ul>
 *   <li>VAPID private key is read from environment variable only — never from source code.</li>
 *   <li>The private key is NEVER logged or returned through any API.</li>
 *   <li>The public key is the only VAPID value exposed to the frontend.</li>
 *   <li>Invalid/expired subscriptions (HTTP 410 or 404) are automatically removed from DB.</li>
 * </ul>
 */
@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    @Value("${app.push.enabled:true}")
    private boolean pushEnabled;

    @Value("${app.push.vapid-public-key:}")
    private String vapidPublicKey;

    @Value("${app.push.vapid-private-key:}")
    private String vapidPrivateKey;

    @Value("${app.push.subject:mailto:example@example.com}")
    private String vapidSubject;

    private final PushSubscriptionRepository subscriptionRepository;

    private PushService pushService;
    private boolean configured = false;

    public PushNotificationService(PushSubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @PostConstruct
    public void init() {
        // Register Bouncy Castle as a JCE provider (required for EC key operations)
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        if (!pushEnabled) {
            log.info("Web Push is disabled (app.push.enabled=false). No push notifications will be sent.");
            return;
        }

        if (vapidPublicKey == null || vapidPublicKey.isBlank()
                || vapidPrivateKey == null || vapidPrivateKey.isBlank()) {
            log.warn("VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables. " +
                    "Push notifications will be disabled until keys are provided.");
            return;
        }

        try {
            // PushService(publicKey, privateKey, subject) — both keys are Base64url-encoded EC key strings
            pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
            configured = true;
            log.info("Web Push / VAPID service initialised successfully.");
        } catch (Exception e) {
            log.error("Failed to initialise Web Push service: {}. Push notifications will be disabled.", e.getMessage());
        }
    }

    /**
     * Returns the VAPID public key (safe to expose to the frontend).
     * The private key is NEVER returned through this or any other method.
     */
    public String getVapidPublicKey() {
        return vapidPublicKey != null ? vapidPublicKey : "";
    }

    /**
     * Returns true if the push service is fully configured and ready to send.
     */
    public boolean isConfigured() {
        return configured && pushEnabled;
    }

    /**
     * Send a push notification to all active subscriptions for a user.
     *
     * @param userId       the internal MongoDB user ID
     * @param title        notification title text
     * @param body         notification body text
     * @param assignmentId the assignment MongoDB ID (used for deep-linking)
     */
    public void sendToUser(String userId, String title, String body, String assignmentId) {
        if (!configured) {
            log.debug("Push not configured — skipping notification for userId={}", userId);
            return;
        }

        List<PushSubscription> subscriptions = subscriptionRepository.findByUserIdAndEnabledTrue(userId);
        if (subscriptions.isEmpty()) {
            log.debug("No active push subscriptions for userId={}", userId);
            return;
        }

        String payload = buildPayload(title, body, assignmentId);

        for (PushSubscription sub : subscriptions) {
            sendToSubscription(sub, payload);
        }
    }

    /**
     * Send a raw push notification to a single subscription.
     * Removes the subscription from the database if the browser endpoint is gone (410 / 404).
     */
    private void sendToSubscription(PushSubscription sub, String payload) {
        try {
            // Use the (endpoint, p256dhString, authString, payloadBytes) constructor
            Notification notification = new Notification(
                    sub.getEndpoint(),
                    sub.getP256dh(),
                    sub.getAuth(),
                    payload.getBytes()
            );

            HttpResponse response = pushService.send(notification);
            int statusCode = response.getStatusLine().getStatusCode();

            if (statusCode == 410 || statusCode == 404) {
                // Subscription is no longer valid — clean it up
                log.info("Push subscription expired (HTTP {}), removing subscriptionId={}", statusCode, sub.getId());
                subscriptionRepository.deleteById(sub.getId());
            } else if (statusCode >= 400) {
                log.warn("Push send failed with HTTP {} for subscriptionId={}", statusCode, sub.getId());
            } else {
                log.debug("Push notification sent successfully to subscriptionId={}", sub.getId());
            }
        } catch (Exception e) {
            log.warn("Exception sending push to subscriptionId={}: {}", sub.getId(), e.getMessage());
        }
    }

    /**
     * Build a JSON payload string for the service worker push handler.
     * Uses simple string building (no Jackson dependency in this service).
     */
    private String buildPayload(String title, String body, String assignmentId) {
        String safeTitle = escapeJson(title);
        String safeBody = escapeJson(body);
        String safeId = assignmentId != null ? assignmentId : "";
        return String.format(
                "{\"title\":\"%s\",\"body\":\"%s\",\"icon\":\"/icons/pwa-192x192.png\"," +
                "\"badge\":\"/icons/pwa-192x192.png\",\"data\":{\"assignmentId\":\"%s\",\"url\":\"/assignments/%s\"}}",
                safeTitle, safeBody, safeId, safeId
        );
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
