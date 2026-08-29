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
    private Instant startDate;
    private Instant dueDate;
    private Instant cutoffDate;
    private AssignmentStatus status;
    private Instant firstSeen;
    private Instant lastChecked;

    /** Convert an Assignment model to an AssignmentResponse DTO with authoritative status */
    public static AssignmentResponse fromAssignment(Assignment assignment) {
        if (assignment == null) {
            return null;
        }
        AssignmentStatus effectiveStatus = calculateEffectiveStatus(assignment);
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .userId(assignment.getUserId())
                .moodleAssignmentId(assignment.getMoodleAssignmentId())
                .courseId(assignment.getCourseId())
                .courseName(assignment.getCourseName())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .startDate(assignment.getStartDate())
                .dueDate(assignment.getDueDate())
                .cutoffDate(assignment.getCutoffDate())
                .status(effectiveStatus)
                .firstSeen(assignment.getFirstSeen())
                .lastChecked(assignment.getLastChecked())
                .build();
    }

    /**
     * Authoritative status rule:
     * 1. If submitted or graded in Moodle -> keep SUBMITTED or GRADED
     * 2. Else if startDate is in the future -> UPCOMING
     * 3. Else if no deadline -> PENDING
     * 4. Else if dueDate is in the past -> OVERDUE
     * 5. Else -> PENDING
     */
    public static AssignmentStatus calculateEffectiveStatus(Assignment assignment) {
        if (assignment == null) {
            return AssignmentStatus.PENDING;
        }
        AssignmentStatus status = assignment.getStatus();
        if (status == AssignmentStatus.SUBMITTED || status == AssignmentStatus.GRADED) {
            return status;
        }
        Instant now = Instant.now();
        if (assignment.getStartDate() != null && assignment.getStartDate().isAfter(now)) {
            return AssignmentStatus.UPCOMING;
        }
        if (assignment.getDueDate() == null) {
            return AssignmentStatus.PENDING;
        }
        if (assignment.getDueDate().isBefore(now)) {
            return AssignmentStatus.OVERDUE;
        }
        return AssignmentStatus.PENDING;
    }
}
