package com.klu.assignmenttracker.controller;

import com.klu.assignmenttracker.dto.ExamResponse;
import com.klu.assignmenttracker.dto.ExamSummaryResponse;
import com.klu.assignmenttracker.service.ExamService;
import com.klu.assignmenttracker.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Handles endpoints for student E-Exams/Tests.
 * All endpoints require a valid JWT token.
 * Students can ONLY see their own exam data.
 */
@RestController
@RequestMapping("/api/exams")
public class ExamController {

    private final UserService userService;
    private final ExamService examService;

    public ExamController(UserService userService, ExamService examService) {
        this.userService = userService;
        this.examService = examService;
    }

    /**
     * GET /api/exams
     * Get all exams for the currently logged-in student.
     */
    @GetMapping
    public ResponseEntity<List<ExamResponse>> getMyExams(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails.getUsername());
        List<ExamResponse> exams = examService.getExamsByUserId(userId);
        return ResponseEntity.ok(exams);
    }

    /**
     * GET /api/exams/summary
     * Get summary counts (total, given, pending, overdue) for the currently logged-in student.
     */
    @GetMapping("/summary")
    public ResponseEntity<ExamSummaryResponse> getMyExamSummary(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails.getUsername());
        ExamSummaryResponse summary = examService.getExamSummaryByUserId(userId);
        return ResponseEntity.ok(summary);
    }

    /**
     * GET /api/exams/{id}
     * Get a specific exam.
     * Security: only returns the exam if it belongs to the requesting student.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ExamResponse> getExam(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails.getUsername());
        ExamResponse exam = examService.getExamByIdAndUserId(id, userId);
        return ResponseEntity.ok(exam);
    }

    private String getUserId(String subject) {
        return userService.getUserBySubject(subject).getId();
    }
}
