package com.klu.assignmenttracker.model;

/**
 * Status of an E-Exam/Test for a student.
 */
public enum ExamStatus {
    /** Exam has been attempted/submitted/completed by the student */
    GIVEN,
    /** Exam is available or has no deadline/future deadline and is open */
    PENDING,
    /** Exam has a future opening/start date and cannot yet be attempted */
    UPCOMING,
    /** Exam close/due deadline has passed without completion */
    OVERDUE
}

