package com.klu.assignmenttracker.controller;

import com.klu.assignmenttracker.dto.AuthResponse;
import com.klu.assignmenttracker.dto.LoginRequest;
import com.klu.assignmenttracker.dto.StudentLoginRequest;
import com.klu.assignmenttracker.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public authentication endpoints — no JWT token required.
 *
 * <ul>
 *   <li>{@code POST /api/auth/student/login} — Student login (studentId + LMS password)</li>
 *   <li>{@code POST /api/auth/login}          — Admin login  (email + BCrypt password)</li>
 * </ul>
 *
 * <p>Student registration is intentionally absent.  Students do NOT create
 * application-level accounts; they authenticate using their KLU LMS credentials.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /**
     * POST /api/auth/student/login
     *
     * <p>Authenticates a student using their KLU Student ID and KLU LMS password.
     * The LMS password is validated but <strong>never stored</strong>.
     * A student record is created on first login; subsequent logins update
     * {@code lastLogin} only — no duplicate records are ever created.
     *
     * <p>Request body: {@code { "studentId": "2200030001", "lmsPassword": "..." }}
     * <p>Response:     {@code { "token": "eyJ...", "type": "Bearer", "user": { ... } }}
     */
    @PostMapping("/student/login")
    public ResponseEntity<AuthResponse> studentLogin(
            @Valid @RequestBody StudentLoginRequest request) {
        return ResponseEntity.ok(userService.studentLogin(request));
    }

    /**
     * POST /api/auth/login
     *
     * <p>Authenticates an admin using their email address and BCrypt-hashed password.
     * This endpoint is reserved for admin users; students use {@code /student/login}.
     *
     * <p>Request body: {@code { "email": "admin@klu.ac.in", "password": "..." }}
     * <p>Response:     {@code { "token": "eyJ...", "type": "Bearer", "user": { ... } }}
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }
}
