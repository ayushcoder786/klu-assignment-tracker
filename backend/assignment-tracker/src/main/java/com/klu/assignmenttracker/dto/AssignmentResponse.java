package com.klu.assignmenttracker.dto;

import com.klu.assignmenttracker.model.Assignment;
import com.klu.assignmenttracker.model.AssignmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * API response representing an Assignment.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResponse {

    private String id;
    private String userId;
    private String moodleAssignmentId;
    private String courseId;
    private String courseName;
    private String title;
    private String description;
    private Instant dueDate;
    private Instant cutoffDate;
    private AssignmentStatus status;
    private Instant firstSeen;
    private Instant lastChecked;

    /** Convert an Assignment model to an AssignmentResponse DTO */
    public static AssignmentResponse fromAssignment(Assignment assignment) {
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .userId(assignment.getUserId())
                .moodleAssignmentId(assignment.getMoodleAssignmentId())
                .courseId(assignment.getCourseId())
                .courseName(assignment.getCourseName())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .dueDate(assignment.getDueDate())
                .cutoffDate(assignment.getCutoffDate())
                .status(assignment.getStatus())
                .firstSeen(assignment.getFirstSeen())
                .lastChecked(assignment.getLastChecked())
                .build();
    }
}
