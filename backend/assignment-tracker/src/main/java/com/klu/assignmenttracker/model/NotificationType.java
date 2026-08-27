package com.klu.assignmenttracker.model;

/**
 * Enumeration of all notification types that the system can send.
 */
public enum NotificationType {

    /** A new assignment was discovered during sync (not previously stored) */
    NEW_ASSIGNMENT,

    /** An assignment is due approximately 24 hours from now */
    DUE_TOMORROW,

    /** An assignment is due today */
    DUE_TODAY,

    /** An assignment has become overdue */
    OVERDUE,

    /** Moodle reports a changed due date for an existing assignment */
    DEADLINE_CHANGED
}
