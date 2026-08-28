package com.klu.assignmenttracker.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Represents a registered user in the system.
 * Stored in the "users" MongoDB collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    /** MongoDB document ID */
    @Id
    private String id;

    /** The student's KLU student ID (e.g., "21BCE9999") */
    @Indexed(unique = true)
    private String studentId;

    /** Full name of the student */
    private String name;

    /**
     * Email address - used for admin login.
     * Sparse index: only non-null values are enforced for uniqueness.
     * Student documents intentionally leave this null (students authenticate via LMS).
     */
    @Indexed(unique = true, sparse = true)
    private String email;

    /**
     * BCrypt-hashed password - used for admin accounts only.
     * SECURITY: Student LMS passwords are NEVER stored here.
     *           Students authenticate via the KLU LMS (Moodle) — not a local password.
     */
    private String password;

    /** Whether this user is a STUDENT or ADMIN */
    @Builder.Default
    private Role role = Role.STUDENT;

    /** Whether the account is ACTIVE or INACTIVE */
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    /** When this account was created (UTC) */
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Last time the user successfully logged in (UTC) */
    private Instant lastLogin;

    /** Last time a successful Moodle sync was done for this user (UTC) */
    private Instant lastSync;
}
