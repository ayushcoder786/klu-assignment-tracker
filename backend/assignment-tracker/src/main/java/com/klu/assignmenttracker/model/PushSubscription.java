package com.klu.assignmenttracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Stores a student's Web Push subscription endpoint and keys.
 *
 * <p>Security guarantees:
 * <ul>
 *   <li>No LMS passwords, Moodle tokens, or other credentials are stored here.</li>
 *   <li>Only the standard Web Push subscription fields are persisted.</li>
 *   <li>Compound index on (userId, endpoint) prevents duplicate subscriptions.</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "push_subscriptions")
@CompoundIndexes({
    @CompoundIndex(name = "user_endpoint_idx", def = "{'userId': 1, 'endpoint': 1}", unique = true)
})
public class PushSubscription {

    @Id
    private String id;

    /** The internal MongoDB user ID of the student owning this subscription */
    @Indexed
    private String userId;

    /** Browser push service endpoint URL */
    private String endpoint;

    /** ECDH public key from the browser (Base64url encoded) */
    private String p256dh;

    /** Authentication secret from the browser (Base64url encoded) */
    private String auth;

    /** Whether this subscription is currently active */
    @Builder.Default
    private boolean enabled = true;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;
}
