package com.klu.assignmenttracker.repository;

import com.klu.assignmenttracker.model.SyncLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Database operations for SyncLog documents.
 */
@Repository
public interface SyncLogRepository extends MongoRepository<SyncLog, String> {

    /** Get all sync logs for a specific user */
    List<SyncLog> findByUserIdOrderByStartedAtDesc(String userId);

    /** Get all sync logs (for admin view), newest first */
    List<SyncLog> findAllByOrderByStartedAtDesc();
}
