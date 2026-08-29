package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.dto.ExamResponse;
import com.klu.assignmenttracker.dto.ExamSummaryResponse;
import com.klu.assignmenttracker.exception.ResourceNotFoundException;
import com.klu.assignmenttracker.model.Exam;
import com.klu.assignmenttracker.model.ExamStatus;
import com.klu.assignmenttracker.repository.ExamRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Business logic for E-Exams and tests.
 * Enforces that students can only access their own exams.
 */
@Service
public class ExamService {

    private final ExamRepository examRepository;

    public ExamService(ExamRepository examRepository) {
        this.examRepository = examRepository;
    }

    /**
     * Get all exams for a specific user.
     * Always filters by userId - students cannot see other students' exams.
     *
     * @param userId the authenticated user's ID
     * @return list of the user's exams
     */
    public List<ExamResponse> getExamsByUserId(String userId) {
        return examRepository.findByUserId(userId)
                .stream()
                .map(ExamResponse::fromExam)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific exam, but only if it belongs to the requesting user.
     *
     * @param id     the exam document ID
     * @param userId the authenticated user's ID
     * @return the exam if it belongs to this user
     * @throws ResourceNotFoundException if not found or belongs to another user
     */
    public ExamResponse getExamByIdAndUserId(String id, String userId) {
        return examRepository.findByIdAndUserId(id, userId)
                .map(ExamResponse::fromExam)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", "id", id));
    }

    /**
     * Get summary metrics (total, given, pending, overdue) for a user's exams.
     *
     * @param userId the authenticated user's ID
     * @return summary response containing counts
     */
    public ExamSummaryResponse getExamSummaryByUserId(String userId) {
        List<Exam> exams = examRepository.findByUserId(userId);
        return calculateSummary(exams);
    }

    /**
     * Calculate summary statistics from a list of exams.
     *
     * @param exams list of exams
     * @return computed summary
     */
    public ExamSummaryResponse calculateSummary(List<Exam> exams) {
        if (exams == null || exams.isEmpty()) {
            return ExamSummaryResponse.builder()
                    .total(0)
                    .given(0)
                    .pending(0)
                    .overdue(0)
                    .build();
        }

        int total = exams.size();
        int given = 0;
        int pending = 0;
        int overdue = 0;

        for (Exam exam : exams) {
            ExamStatus status = exam.getStatus();
            if (status == ExamStatus.GIVEN) {
                given++;
            } else if (status == ExamStatus.OVERDUE) {
                overdue++;
            } else {
                pending++;
            }
        }

        return ExamSummaryResponse.builder()
                .total(total)
                .given(given)
                .pending(pending)
                .overdue(overdue)
                .build();
    }
}
