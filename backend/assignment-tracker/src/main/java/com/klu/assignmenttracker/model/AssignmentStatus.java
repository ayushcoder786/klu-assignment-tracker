package com.klu.assignmenttracker.model;

/**
 * Status of an assignment for a student.
 */
public enum AssignmentStatus {
    /** Assignment is open and not yet submitted */
    PENDING,
    /** Assignment has been submitted */
    SUBMITTED,
    /** Assignment deadline has passed without submission */
    OVERDUE,
    /** Assignment has been graded */
    GRADED
}
