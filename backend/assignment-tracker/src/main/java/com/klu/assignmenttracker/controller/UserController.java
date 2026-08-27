package com.klu.assignmenttracker.controller;

import com.klu.assignmenttracker.dto.AssignmentResponse;
import com.klu.assignmenttracker.dto.CourseResponse;
import com.klu.assignmenttracker.dto.UserResponse;
import com.klu.assignmenttracker.service.AssignmentService;
import com.klu.assignmenttracker.service.CourseService;
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
 * Handles endpoints for the currently logged-in student.
 * All endpoints require a valid JWT token.
 * Students can ONLY see their own data.
 */
@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;
    private final CourseService courseService;
    private final AssignmentService assignmentService;

    public UserController(UserService userService,
            CourseService courseService,
            AssignmentService assignmentService) {
        this.userService = userService;
        this.courseService = courseService;
        this.assignmentService = assignmentService;
    }

    /**
     * GET /api/me
     * Get the currently logged-in user's profile.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        UserResponse user = userService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(user);
    }

    /**
     * GET /api/courses
     * Get all courses for the currently logged-in student.
     */
    @GetMapping("/courses")
    public ResponseEntity<List<CourseResponse>> getMyCourses(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails.getUsername());
        List<CourseResponse> courses = courseService.getCoursesByUserId(userId);
        return ResponseEntity.ok(courses);
    }

    /**
     * GET /api/assignments
     * Get all assignments for the currently logged-in student.
     */
    @GetMapping("/assignments")
    public ResponseEntity<List<AssignmentResponse>> getMyAssignments(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails.getUsername());
        List<AssignmentResponse> assignments = assignmentService.getAssignmentsByUserId(userId);
        return ResponseEntity.ok(assignments);
    }

    /**
     * GET /api/assignments/{id}
     * Get a specific assignment.
     * Security: only returns the assignment if it belongs to the requesting
     * student.
     */
    @GetMapping("/assignments/{id}")
    public ResponseEntity<AssignmentResponse> getAssignment(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = getUserId(userDetails.getUsername());
        AssignmentResponse assignment = assignmentService.getAssignmentByIdAndUserId(id, userId);
        return ResponseEntity.ok(assignment);
    }

    /**
     * Helper: resolve MongoDB user ID from JWT subject.
     *
     * <p>Student tokens carry a {@code studentId} as subject;
     * admin tokens carry an {@code email}.  {@code getUserBySubject}
     * handles both transparently.
     */
    private String getUserId(String subject) {
        return userService.getUserBySubject(subject).getId();
    }
}
