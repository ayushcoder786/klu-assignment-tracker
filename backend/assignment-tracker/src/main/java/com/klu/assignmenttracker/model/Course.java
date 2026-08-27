package com.klu.assignmenttracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Represents a Moodle course that belongs to a student.
 * Stored in the "courses" MongoDB collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "courses")
public class Course {

    /** MongoDB document ID */
    @Id
    private String id;

    /** The user (student) who is enrolled in this course */
    private String userId;

    /** The course ID from KLU Moodle (will be used when Moodle sync is implemented) */
    private String moodleCourseId;

    /** Full course name, e.g., "Data Structures and Algorithms" */
    private String name;

    /** Short name/code, e.g., "DSA" */
    private String shortName;
}
