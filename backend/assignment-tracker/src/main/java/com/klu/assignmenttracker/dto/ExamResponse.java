package com.klu.assignmenttracker.dto;

import com.klu.assignmenttracker.model.Exam;
import com.klu.assignmenttracker.model.ExamStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * API response representing an E-Exam.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResponse {

    private String id;
    private String userId;
    private String moodleQuizId;
    private String courseModuleId;
    private String courseId;
    private String courseName;
    private String title;
    private String description;
    private Instant openDate;
    private Instant closeDate;
    private Long timeLimit;
    private Integer attemptsAllowed;
    private Integer attemptsCount;
    private Double maxGrade;
    private Double obtainedGrade;
    private String lmsUrl;
    private ExamStatus status;
    private Instant completedAt;
    private Instant firstSeen;
    private Instant lastChecked;

    /** Convert an Exam model to an ExamResponse DTO */
    public static ExamResponse fromExam(Exam exam) {
        return ExamResponse.builder()
                .id(exam.getId())
                .userId(exam.getUserId())
                .moodleQuizId(exam.getMoodleQuizId())
                .courseModuleId(exam.getCourseModuleId())
                .courseId(exam.getCourseId())
                .courseName(exam.getCourseName())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .openDate(exam.getOpenDate())
                .closeDate(exam.getCloseDate())
                .timeLimit(exam.getTimeLimit())
                .attemptsAllowed(exam.getAttemptsAllowed())
                .attemptsCount(exam.getAttemptsCount())
                .maxGrade(exam.getMaxGrade())
                .obtainedGrade(exam.getObtainedGrade())
                .lmsUrl(exam.getLmsUrl())
                .status(exam.getStatus())
                .completedAt(exam.getCompletedAt())
                .firstSeen(exam.getFirstSeen())
                .lastChecked(exam.getLastChecked())
                .build();
    }
}
