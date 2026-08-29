package com.klu.assignmenttracker.controller;

import com.klu.assignmenttracker.dto.ExamResponse;
import com.klu.assignmenttracker.dto.ExamSummaryResponse;
import com.klu.assignmenttracker.dto.SyncLogResponse;
import com.klu.assignmenttracker.dto.SyncResponse;
import com.klu.assignmenttracker.dto.UserResponse;
import com.klu.assignmenttracker.service.ExamService;
import com.klu.assignmenttracker.service.SyncService;
import com.klu.assignmenttracker.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin-only endpoints for managing users and viewing all sync logs.
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final SyncService syncService;
    private final ExamService examService;

    public AdminController(UserService userService, SyncService syncService, ExamService examService) {
        this.userService = userService;
        this.syncService = syncService;
        this.examService = examService;
    }

    /**
     * GET /api/admin/users
     * List all registered users.
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * GET /api/admin/users/{id}
     * Get details for a specific user.
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    /**
     * POST /api/admin/users/{id}/sync
     * Manually trigger a Moodle sync for a specific user.
     */
    @PostMapping("/users/{id}/sync")
    public ResponseEntity<SyncResponse> triggerSyncForUser(@PathVariable String id) {
        SyncResponse response = syncService.triggerSyncForUser(id);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/admin/sync-logs
     * View all sync logs across all users.
     */
    @GetMapping("/sync-logs")
    public ResponseEntity<List<SyncLogResponse>> getAllSyncLogs() {
        return ResponseEntity.ok(syncService.getAllSyncLogs());
    }

    /**
     * GET /api/admin/users/{id}/exams
     * Get all exams for a specific user (admin only).
     */
    @GetMapping("/users/{id}/exams")
    public ResponseEntity<List<ExamResponse>> getUserExams(@PathVariable String id) {
        return ResponseEntity.ok(examService.getExamsByUserId(id));
    }

    /**
     * GET /api/admin/users/{id}/exams/summary
     * Get exam summary counts for a specific user (admin only).
     */
    @GetMapping("/users/{id}/exams/summary")
    public ResponseEntity<ExamSummaryResponse> getUserExamSummary(@PathVariable String id) {
        return ResponseEntity.ok(examService.getExamSummaryByUserId(id));
    }
}
