package com.klu.assignmenttracker.repository;

import com.klu.assignmenttracker.model.Course;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Database operations for Course documents.
 */
@Repository
public interface CourseRepository extends MongoRepository<Course, String> {

    /** Get all courses for a specific student */
    List<Course> findByUserId(String userId);

    /** Find a specific course by user ID and Moodle course ID */
    java.util.Optional<Course> findByUserIdAndMoodleCourseId(String userId, String moodleCourseId);

    /** Check if a course already exists for this student */
    boolean existsByUserIdAndMoodleCourseId(String userId, String moodleCourseId);
}
