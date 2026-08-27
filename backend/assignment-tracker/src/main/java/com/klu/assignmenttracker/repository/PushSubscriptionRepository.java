package com.klu.assignmenttracker.repository;

import com.klu.assignmenttracker.model.PushSubscription;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends MongoRepository<PushSubscription, String> {

    /** All active subscriptions for a user */
    List<PushSubscription> findByUserIdAndEnabledTrue(String userId);

    /** Find an existing subscription by endpoint (for upsert logic) */
    Optional<PushSubscription> findByUserIdAndEndpoint(String userId, String endpoint);

    /** Delete all subscriptions for a user (e.g., on explicit unsubscribe) */
    void deleteByUserIdAndEndpoint(String userId, String endpoint);

    /** Count subscriptions for a user */
    long countByUserId(String userId);
}
