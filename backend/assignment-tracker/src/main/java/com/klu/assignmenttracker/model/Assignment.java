package com.klu.assignmenttracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Represents an assignment from a Moodle course.
 * Stored in the "assignments" MongoDB collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "assignments")
public class Assignment {

    /** MongoDB document ID */
    @Id
    private String id;

    /** The user (student) this assignment belongs to */
    private String userId;

    /** The assignment ID from KLU Moodle */
    private String moodleAssignmentId;

    /** Reference to the Course document this assignment belongs to */
    private String courseId;

    /** Course name (stored here for easy display without a join) */
    private String courseName;

    /** Title of the assignment */
    private String title;

    /** Full description / instructions for the assignment */
    private String description;

    /** Deadline: when the assignment is due (UTC) */
    private Instant dueDate;

    /** Cut-off date: after this, no more submissions are accepted (UTC) */
    private Instant cutoffDate;

    /** Whether the assignment is PENDING, SUBMITTED, OVERDUE, or GRADED */
    @Builder.Default
    private AssignmentStatus status = AssignmentStatus.PENDING;

    /** When we first discovered this assignment from Moodle (UTC) */
    @Builder.Default
    private Instant firstSeen = Instant.now();

    /** When we last refreshed this assignment's data from Moodle (UTC) */
    @Builder.Default
    private Instant lastChecked = Instant.now();
}
