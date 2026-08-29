package com.klu.assignmenttracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Represents an E-Exam or Test from a Moodle course.
 * Stored in the "exams" MongoDB collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "exams")
public class Exam {

    /** MongoDB document ID */
    @Id
    private String id;

    /** The user (student) this exam belongs to */
    private String userId;

    /** The quiz ID from KLU Moodle */
    private String moodleQuizId;

    /** Moodle Course Module ID (cmid) for direct LMS URL launch */
    private String courseModuleId;

    /** Reference to the Course document this exam belongs to */
    private String courseId;

    /** Course name (stored here for easy display without a join) */
    private String courseName;

    /** Title/name of the exam */
    private String title;

    /** Instructions / description for the exam */
    private String description;

    /** When the exam opens / becomes available (UTC) */
    private Instant openDate;

    /** When the exam closes / deadline (UTC, null if no deadline) */
    private Instant closeDate;

    /** Time limit for the exam in seconds (0 or null if unlimited) */
    private Long timeLimit;

    /** Number of attempts allowed (0 or null if unlimited) */
    private Integer attemptsAllowed;

    /** Number of attempts completed/taken by the student */
    @Builder.Default
    private Integer attemptsCount = 0;

    /** Maximum possible grade/score */
    private Double maxGrade;

    /** Score/grade obtained by the student if given */
    private Double obtainedGrade;

    /** Direct Web URL to the exam in KLU Moodle LMS */
    private String lmsUrl;

    /** Whether the exam is GIVEN, PENDING, or OVERDUE */
    @Builder.Default
    private ExamStatus status = ExamStatus.PENDING;

    /** When the student completed/submitted their attempt (UTC) */
    private Instant completedAt;

    /** When we first discovered this exam from Moodle (UTC) */
    @Builder.Default
    private Instant firstSeen = Instant.now();

    /** When we last refreshed this exam's data from Moodle (UTC) */
    @Builder.Default
    private Instant lastChecked = Instant.now();
}
