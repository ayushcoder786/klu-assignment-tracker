package com.klu.assignmenttracker.repository;

import com.klu.assignmenttracker.model.Assignment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Database operations for Assignment documents.
 */
@Repository
public interface AssignmentRepository extends MongoRepository<Assignment, String> {

    /** Get all assignments for a specific student */
    List<Assignment> findByUserId(String userId);

    /** Get assignments for a specific student in a specific course */
    List<Assignment> findByUserIdAndCourseId(String userId, String courseId);

    /** Find a specific assignment that belongs to a specific user (prevents data leaks) */
    Optional<Assignment> findByIdAndUserId(String id, String userId);

    /** Find a specific assignment by user ID and Moodle assignment ID */
    Optional<Assignment> findByUserIdAndMoodleAssignmentId(String userId, String moodleAssignmentId);

    /** Check if an assignment exists for this user and Moodle assignment ID */
    boolean existsByUserIdAndMoodleAssignmentId(String userId, String moodleAssignmentId);
}
