package com.klu.assignmenttracker.repository;

import com.klu.assignmenttracker.model.NotificationPreferences;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface NotificationPreferencesRepository extends MongoRepository<NotificationPreferences, String> {

    /** Get preferences for a specific user (one doc per user) */
    Optional<NotificationPreferences> findByUserId(String userId);

    /** Delete preferences document for a user */
    void deleteByUserId(String userId);
}
