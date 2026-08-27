package com.klu.assignmenttracker.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Secure, in-memory cache for transient Moodle Web Service tokens.
 *
 * <h2>Security & Architecture Guarantees</h2>
 * <ul>
 *   <li>Moodle tokens are NEVER saved to MongoDB or persistent storage.</li>
 *   <li>Tokens are stored strictly in memory and automatically expire after a configurable TTL.</li>
 *   <li>Tokens are never logged.</li>
 *   <li>Allows authenticated sessions to perform background or on-demand sync without re-prompting
 *       the student for their LMS password.</li>
 * </ul>
 */
@Component
public class MoodleTokenCache {

    private static final Logger log = LoggerFactory.getLogger(MoodleTokenCache.class);

    @Value("${app.lms.token-cache-ttl-minutes:120}")
    private long ttlMinutes;

    private final Map<String, CachedToken> tokenCache = new ConcurrentHashMap<>();

    /**
     * Store a Moodle token in memory for a user.
     *
     * @param userId the internal user ID or student ID
     * @param token  the Moodle Web Service token
     */
    public void storeToken(String userId, String token) {
        if (userId == null || token == null || token.isBlank()) {
            return;
        }
        Instant expiresAt = Instant.now().plus(ttlMinutes, ChronoUnit.MINUTES);
        tokenCache.put(userId, new CachedToken(token, expiresAt));
        log.debug("Stored in-memory Moodle token for userId={} with TTL={}m", userId, ttlMinutes);
    }

    /**
     * Retrieve the cached Moodle token if it exists and has not expired.
     *
     * @param userId the internal user ID or student ID
     * @return Optional containing the active Moodle token, or empty if absent/expired
     */
    public Optional<String> getToken(String userId) {
        if (userId == null) {
            return Optional.empty();
        }
        CachedToken entry = tokenCache.get(userId);
        if (entry == null) {
            return Optional.empty();
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            tokenCache.remove(userId);
            log.debug("Evicted expired Moodle token for userId={}", userId);
            return Optional.empty();
        }
        return Optional.of(entry.token());
    }

    /**
     * Explicitly evict a cached token (e.g. on logout or invalidation).
     *
     * @param userId the internal user ID or student ID
     */
    public void evictToken(String userId) {
        if (userId != null) {
            tokenCache.remove(userId);
            log.debug("Evicted Moodle token for userId={}", userId);
        }
    }

    /**
     * Clear all cached tokens (e.g. for testing).
     */
    public void clear() {
        tokenCache.clear();
    }

    private record CachedToken(String token, Instant expiresAt) {}
}
