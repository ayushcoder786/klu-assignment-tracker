package com.klu.assignmenttracker.controller;

import com.klu.assignmenttracker.dto.AuthResponse;
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
 * <p>Unified authentication endpoint for all users (students and super admin).
 * All users authenticate via their KLU Student ID and KLU LMS password.
 * The user role is determined automatically by the backend.
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
     * POST /api/auth/login
     *
     * <p>Authenticates a user using their KLU Student ID and KLU LMS password.
     * The LMS password is validated with KLU Moodle but <strong>never stored</strong>.
     * Role (STUDENT vs ADMIN) is resolved by the backend.
     *
     * <p>Request body: {@code { "studentId": "2500032102", "lmsPassword": "..." }}
     * <p>Response:     {@code { "token": "eyJ...", "type": "Bearer", "user": { ... } }}
     */
    @PostMapping({"/student/login", "/login"})
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody StudentLoginRequest request) {
        return ResponseEntity.ok(userService.studentLogin(request));
    }
}
