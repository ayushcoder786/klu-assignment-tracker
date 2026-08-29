package com.klu.assignmenttracker.repository;

import com.klu.assignmenttracker.model.Exam;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Database operations for Exam documents.
 */
@Repository
public interface ExamRepository extends MongoRepository<Exam, String> {

    /** Get all exams for a specific student */
    List<Exam> findByUserId(String userId);

    /** Get exams for a specific student in a specific course */
    List<Exam> findByUserIdAndCourseId(String userId, String courseId);

    /** Find a specific exam that belongs to a specific user (prevents data leaks) */
    Optional<Exam> findByIdAndUserId(String id, String userId);

    /** Find a specific exam by user ID and Moodle quiz ID */
    Optional<Exam> findByUserIdAndMoodleQuizId(String userId, String moodleQuizId);

    /** Check if an exam exists for this user and Moodle quiz ID */
    boolean existsByUserIdAndMoodleQuizId(String userId, String moodleQuizId);

    /** Delete all exams for a user (useful for cleanup/testing) */
    void deleteByUserId(String userId);
}
