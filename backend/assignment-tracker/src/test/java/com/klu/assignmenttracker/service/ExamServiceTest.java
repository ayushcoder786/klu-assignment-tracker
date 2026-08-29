package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.dto.ExamResponse;
import com.klu.assignmenttracker.dto.ExamSummaryResponse;
import com.klu.assignmenttracker.exception.ResourceNotFoundException;
import com.klu.assignmenttracker.model.Exam;
import com.klu.assignmenttracker.model.ExamStatus;
import com.klu.assignmenttracker.repository.ExamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExamServiceTest {

    @Mock
    private ExamRepository examRepository;

    private ExamService examService;

    @BeforeEach
    void setUp() {
        examService = new ExamService(examRepository);
    }

    @Test
    @DisplayName("calculateSummary correctly computes total, given, pending, and overdue counts")
    void testCalculateSummary() {
        Exam e1 = Exam.builder().id("1").status(ExamStatus.GIVEN).build();
        Exam e2 = Exam.builder().id("2").status(ExamStatus.GIVEN).build();
        Exam e3 = Exam.builder().id("3").status(ExamStatus.GIVEN).build();
        Exam e4 = Exam.builder().id("4").status(ExamStatus.PENDING).build();
        Exam e5 = Exam.builder().id("5").status(ExamStatus.PENDING).build();
        Exam e6 = Exam.builder().id("6").status(ExamStatus.OVERDUE).build();

        ExamSummaryResponse summary = examService.calculateSummary(List.of(e1, e2, e3, e4, e5, e6));

        assertNotNull(summary);
        assertEquals(6, summary.getTotal(), "Total exams should be 6");
        assertEquals(3, summary.getGiven(), "Given exams should be 3");
        assertEquals(2, summary.getPending(), "Pending exams should be 2");
        assertEquals(1, summary.getOverdue(), "Overdue exams should be 1");
    }

    @Test
    @DisplayName("calculateSummary returns all zeros for empty or null list")
    void testCalculateSummary_Empty() {
        ExamSummaryResponse emptySummary = examService.calculateSummary(List.of());
        assertEquals(0, emptySummary.getTotal());
        assertEquals(0, emptySummary.getGiven());
        assertEquals(0, emptySummary.getPending());
        assertEquals(0, emptySummary.getOverdue());

        ExamSummaryResponse nullSummary = examService.calculateSummary(null);
        assertEquals(0, nullSummary.getTotal());
    }

    @Test
    @DisplayName("getExamsByUserId filters exams strictly by student userId")
    void testGetExamsByUserId() {
        String userId = "student-123";
        Exam exam = Exam.builder()
                .id("exam-1")
                .userId(userId)
                .title("MID-1 Java E-Exam")
                .courseName("Java Programming")
                .status(ExamStatus.PENDING)
                .openDate(Instant.now().minusSeconds(3600))
                .closeDate(Instant.now().plusSeconds(7200))
                .lmsUrl("https://lms.kluniversity.in/mod/quiz/view.php?id=901")
                .build();

        when(examRepository.findByUserId(userId)).thenReturn(List.of(exam));

        List<ExamResponse> responses = examService.getExamsByUserId(userId);
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("MID-1 Java E-Exam", responses.get(0).getTitle());
        assertEquals(ExamStatus.PENDING, responses.get(0).getStatus());
        assertEquals("https://lms.kluniversity.in/mod/quiz/view.php?id=901", responses.get(0).getLmsUrl());
        verify(examRepository).findByUserId(userId);
    }

    @Test
    @DisplayName("getExamByIdAndUserId succeeds when exam belongs to requesting user")
    void testGetExamByIdAndUserId_Success() {
        String userId = "student-123";
        String examId = "exam-1";
        Exam exam = Exam.builder()
                .id(examId)
                .userId(userId)
                .title("OS Quiz 1")
                .status(ExamStatus.GIVEN)
                .obtainedGrade(19.0)
                .maxGrade(20.0)
                .build();

        when(examRepository.findByIdAndUserId(examId, userId)).thenReturn(Optional.of(exam));

        ExamResponse response = examService.getExamByIdAndUserId(examId, userId);
        assertNotNull(response);
        assertEquals("OS Quiz 1", response.getTitle());
        assertEquals(ExamStatus.GIVEN, response.getStatus());
        assertEquals(19.0, response.getObtainedGrade());
    }

    @Test
    @DisplayName("getExamByIdAndUserId throws ResourceNotFoundException if exam not found or belongs to another user")
    void testGetExamByIdAndUserId_NotFound() {
        when(examRepository.findByIdAndUserId("exam-99", "student-123")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                examService.getExamByIdAndUserId("exam-99", "student-123"));
    }
}
