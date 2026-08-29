package com.klu.assignmenttracker.model;

/**
 * Status of an E-Exam/Test for a student.
 */
public enum ExamStatus {
    /** Exam has been attempted/submitted/completed by the student */
    GIVEN,
    /** Exam is available or upcoming and not yet completed within allowed timeframe */
    PENDING,
    /** Exam close/due deadline has passed without completion */
    OVERDUE
}
