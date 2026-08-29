package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.dto.AssignmentResponse;
import com.klu.assignmenttracker.model.Assignment;
import com.klu.assignmenttracker.model.AssignmentStatus;
import com.klu.assignmenttracker.model.User;
import com.klu.assignmenttracker.repository.AssignmentRepository;
import com.klu.assignmenttracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssignmentServiceTest {

    @Mock
    private AssignmentRepository assignmentRepository;

    @Mock
    private UserRepository userRepository;

    private AssignmentService assignmentService;

    @BeforeEach
    void setUp() {
        assignmentService = new AssignmentService(assignmentRepository, userRepository);
    }

    @Test
    void testGetAssignmentsByUserIdOrStudentId_ResolvesStudentId() {
        User user = User.builder()
                .id("mongo-user-1")
                .studentId("2500032102")
                .name("AYUSH KUMAR")
                .build();

        Assignment a1 = Assignment.builder()
                .id("assign-1")
                .userId("mongo-user-1")
                .title("Lab Exercise 1")
                .courseName("Data Structures")
                .dueDate(Instant.now().plusSeconds(86400)) // tomorrow
                .status(AssignmentStatus.PENDING)
                .build();

        when(userRepository.findById("2500032102")).thenReturn(Optional.empty());
        when(userRepository.findByStudentId("2500032102")).thenReturn(Optional.of(user));
        when(assignmentRepository.findByUserId("mongo-user-1")).thenReturn(List.of(a1));

        List<AssignmentResponse> results = assignmentService.getAssignmentsByUserIdOrStudentId("2500032102");

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Lab Exercise 1", results.get(0).getTitle());
        assertEquals("Data Structures", results.get(0).getCourseName());
        assertEquals(AssignmentStatus.PENDING, results.get(0).getStatus());
    }

    @Test
    void testAuthoritativeStatus_FutureDueDate_Pending() {
        Assignment a = Assignment.builder()
                .id("a1")
                .title("Future Assignment")
                .dueDate(Instant.now().plusSeconds(86400 * 5))
                .status(AssignmentStatus.PENDING)
                .build();

        AssignmentResponse resp = AssignmentResponse.fromAssignment(a);
        assertEquals(AssignmentStatus.PENDING, resp.getStatus());
    }

    @Test
    void testAuthoritativeStatus_PastDueDate_Overdue() {
        Assignment a = Assignment.builder()
                .id("a2")
                .title("Past Unsubmitted Assignment")
                .dueDate(Instant.now().minusSeconds(86400 * 2))
                .status(AssignmentStatus.PENDING) // was pending in DB but past due
                .build();

        AssignmentResponse resp = AssignmentResponse.fromAssignment(a);
        assertEquals(AssignmentStatus.OVERDUE, resp.getStatus());
    }

    @Test
    void testAuthoritativeStatus_PastDueDate_Submitted() {
        Assignment a = Assignment.builder()
                .id("a3")
                .title("Past Submitted Assignment")
                .dueDate(Instant.now().minusSeconds(86400 * 2))
                .status(AssignmentStatus.SUBMITTED)
                .build();

        AssignmentResponse resp = AssignmentResponse.fromAssignment(a);
        assertEquals(AssignmentStatus.SUBMITTED, resp.getStatus());
    }

    @Test
    void testAuthoritativeStatus_FutureStartDate_Upcoming() {
        Assignment a = Assignment.builder()
                .id("a4")
                .title("Future Start Assignment")
                .startDate(Instant.now().plusSeconds(86400 * 3))
                .dueDate(Instant.now().plusSeconds(86400 * 10))
                .status(AssignmentStatus.PENDING)
                .build();

        AssignmentResponse resp = AssignmentResponse.fromAssignment(a);
        assertEquals(AssignmentStatus.UPCOMING, resp.getStatus());
    }

    @Test
    void testAuthoritativeStatus_NoDueDate_Pending() {
        Assignment a = Assignment.builder()
                .id("a5")
                .title("No Due Date Assignment")
                .dueDate(null)
                .status(AssignmentStatus.PENDING)
                .build();

        AssignmentResponse resp = AssignmentResponse.fromAssignment(a);
        assertEquals(AssignmentStatus.PENDING, resp.getStatus());
    }
}
