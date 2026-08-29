package com.klu.assignmenttracker;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.klu.assignmenttracker.model.Exam;
import com.klu.assignmenttracker.model.ExamStatus;
import com.klu.assignmenttracker.model.Role;
import com.klu.assignmenttracker.model.User;
import com.klu.assignmenttracker.repository.ExamRepository;
import com.klu.assignmenttracker.repository.UserRepository;
import com.klu.assignmenttracker.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.sync.initial-delay-ms=3600000"
})
public class ExamControllerIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User testStudent;
    private User otherStudent;
    private User adminUser;
    private String studentJwtToken;
    private String adminJwtToken;

    @BeforeEach
    void setup() {
        this.mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity())
                .build();

        examRepository.deleteAll();

        testStudent = userRepository.findByStudentId("2200030001").orElseGet(() ->
                userRepository.save(User.builder()
                        .studentId("2200030001")
                        .name("Test Student One")
                        .role(Role.STUDENT)
                        .build())
        );

        otherStudent = userRepository.findByStudentId("2200030002").orElseGet(() ->
                userRepository.save(User.builder()
                        .studentId("2200030002")
                        .name("Test Student Two")
                        .role(Role.STUDENT)
                        .build())
        );

        adminUser = userRepository.findByStudentId("2500032102").orElseGet(() ->
                userRepository.save(User.builder()
                        .studentId("2500032102")
                        .name("Admin User")
                        .role(Role.ADMIN)
                        .build())
        );

        studentJwtToken = jwtTokenProvider.generateToken(testStudent.getStudentId());
        adminJwtToken = jwtTokenProvider.generateToken(adminUser.getStudentId());
    }

    @AfterEach
    void tearDown() {
        examRepository.deleteAll();
        if (testStudent != null && testStudent.getId() != null) {
            userRepository.deleteById(testStudent.getId());
        }
        if (otherStudent != null && otherStudent.getId() != null) {
            userRepository.deleteById(otherStudent.getId());
        }
        if (adminUser != null && adminUser.getId() != null) {
            userRepository.deleteById(adminUser.getId());
        }
    }

    @Test
    @DisplayName("GET /api/exams returns only authenticated student's exams")
    void testGetMyExams_Isolation() throws Exception {
        // Save exam for testStudent
        Exam exam1 = Exam.builder()
                .userId(testStudent.getId())
                .moodleQuizId("801")
                .title("Java Mid-1 Exam")
                .courseName("Java Programming")
                .status(ExamStatus.PENDING)
                .build();
        examRepository.save(exam1);

        // Save exam for otherStudent
        Exam examOther = Exam.builder()
                .userId(otherStudent.getId())
                .moodleQuizId("802")
                .title("Other Student's Exam")
                .courseName("Operating Systems")
                .status(ExamStatus.GIVEN)
                .build();
        examRepository.save(examOther);

        mockMvc.perform(get("/api/exams")
                        .header("Authorization", "Bearer " + studentJwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Java Mid-1 Exam"))
                .andExpect(jsonPath("$[0].moodleQuizId").value("801"));
    }

    @Test
    @DisplayName("GET /api/exams/summary returns correct summary counts")
    void testGetMyExamSummary() throws Exception {
        Exam e1 = Exam.builder().userId(testStudent.getId()).status(ExamStatus.GIVEN).build();
        Exam e2 = Exam.builder().userId(testStudent.getId()).status(ExamStatus.GIVEN).build();
        Exam e3 = Exam.builder().userId(testStudent.getId()).status(ExamStatus.PENDING).build();
        Exam e4 = Exam.builder().userId(testStudent.getId()).closeDate(Instant.now().minusSeconds(86400)).status(ExamStatus.OVERDUE).build();
        examRepository.saveAll(List.of(e1, e2, e3, e4));

        mockMvc.perform(get("/api/exams/summary")
                        .header("Authorization", "Bearer " + studentJwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(4))
                .andExpect(jsonPath("$.given").value(2))
                .andExpect(jsonPath("$.pending").value(1))
                .andExpect(jsonPath("$.overdue").value(1));
    }

    @Test
    @DisplayName("GET /api/exams/{id} returns exam if owned, 404 if owned by other student")
    void testGetExamById_Security() throws Exception {
        Exam myExam = Exam.builder()
                .userId(testStudent.getId())
                .title("My Security Exam")
                .status(ExamStatus.PENDING)
                .build();
        myExam = examRepository.save(myExam);

        Exam otherExam = Exam.builder()
                .userId(otherStudent.getId())
                .title("Secret Other Exam")
                .status(ExamStatus.PENDING)
                .build();
        otherExam = examRepository.save(otherExam);

        // Can access own
        mockMvc.perform(get("/api/exams/" + myExam.getId())
                        .header("Authorization", "Bearer " + studentJwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("My Security Exam"));

        // Cannot access other student's exam
        mockMvc.perform(get("/api/exams/" + otherExam.getId())
                        .header("Authorization", "Bearer " + studentJwtToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Admin endpoints: GET /api/admin/users/{id}/exams and summary")
    void testAdminGetStudentExams() throws Exception {
        Exam e1 = Exam.builder().userId(testStudent.getId()).title("Admin Visible Exam").status(ExamStatus.GIVEN).build();
        examRepository.save(e1);

        mockMvc.perform(get("/api/admin/users/" + testStudent.getId() + "/exams")
                        .header("Authorization", "Bearer " + adminJwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Admin Visible Exam"));

        mockMvc.perform(get("/api/admin/users/" + testStudent.getId() + "/exams/summary")
                        .header("Authorization", "Bearer " + adminJwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.given").value(1));
    }
}
