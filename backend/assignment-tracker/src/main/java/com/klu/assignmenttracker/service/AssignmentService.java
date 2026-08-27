package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.dto.AssignmentResponse;
import com.klu.assignmenttracker.exception.ResourceNotFoundException;
import com.klu.assignmenttracker.repository.AssignmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Business logic for assignments.
 * Enforces that students can only access their own assignments.
 */
@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;

    public AssignmentService(AssignmentRepository assignmentRepository) {
        this.assignmentRepository = assignmentRepository;
    }

    /**
     * Get all assignments for a specific user.
     * Always filters by userId - students cannot see other students' assignments.
     *
     * @param userId the authenticated user's ID
     * @return list of the user's assignments
     */
    public List<AssignmentResponse> getAssignmentsByUserId(String userId) {
        return assignmentRepository.findByUserId(userId)
                .stream()
                .map(AssignmentResponse::fromAssignment)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific assignment, but only if it belongs to the requesting user.
     * This prevents student A from accessing student B's assignments by guessing
     * IDs.
     *
     * @param id     the assignment ID
     * @param userId the authenticated user's ID
     * @return the assignment if it belongs to this user
     * @throws ResourceNotFoundException if not found or belongs to another user
     */
    public AssignmentResponse getAssignmentByIdAndUserId(String id, String userId) {
        return assignmentRepository.findByIdAndUserId(id, userId)
                .map(AssignmentResponse::fromAssignment)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", id));
    }
}
