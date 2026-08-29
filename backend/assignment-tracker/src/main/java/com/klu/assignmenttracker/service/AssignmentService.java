package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.dto.AssignmentResponse;
import com.klu.assignmenttracker.exception.ResourceNotFoundException;
import com.klu.assignmenttracker.model.User;
import com.klu.assignmenttracker.repository.AssignmentRepository;
import com.klu.assignmenttracker.repository.UserRepository;
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
    private final UserRepository userRepository;

    public AssignmentService(AssignmentRepository assignmentRepository, UserRepository userRepository) {
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get all assignments for a specific user ID.
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
     * Get all assignments for a user by user ID or student ID (for admin portal).
     *
     * @param idOrStudentId user ID or student ID
     * @return list of assignments for the specified user
     */
    public List<AssignmentResponse> getAssignmentsByUserIdOrStudentId(String idOrStudentId) {
        String userId = userRepository.findById(idOrStudentId)
                .or(() -> userRepository.findByStudentId(idOrStudentId))
                .or(() -> userRepository.findByEmail(idOrStudentId))
                .map(User::getId)
                .orElse(idOrStudentId);

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

