package com.klu.assignmenttracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for POST /api/auth/student/login
 *
 * <p>Students log in with their KLU Student ID and LMS (Moodle) password.
 * The LMS password is used ONLY for authentication and is NEVER stored in the database.
 */
@Data
public class StudentLoginRequest {

    /**
     * The student's KLU-assigned student ID (e.g., "2200030001").
     * This is the unique identifier used to create or locate the student record.
     */
    @NotBlank(message = "Student ID is required")
    private String studentId;

    /**
     * The student's KLU LMS (Moodle) password.
     * SECURITY: This value is NEVER persisted to MongoDB.
     *           It is NEVER logged.
     *           It is NEVER returned in any API response.
     *           It exists in memory only long enough to perform LMS authentication.
     */
    @NotBlank(message = "LMS password is required")
    private String lmsPassword;
}
