package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.dto.AuthResponse;
import com.klu.assignmenttracker.dto.StudentLoginRequest;
import com.klu.assignmenttracker.model.Role;
import com.klu.assignmenttracker.model.User;
import com.klu.assignmenttracker.repository.UserRepository;
import com.klu.assignmenttracker.security.JwtTokenProvider;
import com.klu.assignmenttracker.security.MoodleTokenCache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private LmsAuthService lmsAuthService;

    @Mock
    private SyncService syncService;

    @Mock
    private MoodleTokenCache moodleTokenCache;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(
                userRepository,
                jwtTokenProvider,
                authenticationManager,
                lmsAuthService,
                syncService,
                moodleTokenCache
        );
    }

    @Test
    void testStudentLogin_Success() {
        StudentLoginRequest request = new StudentLoginRequest();
        request.setStudentId("2200030001");
        request.setLmsPassword("secret-pass");

        when(lmsAuthService.authenticateAndGetToken("2200030001", "secret-pass"))
                .thenReturn("moodle-token-xyz");

        User user = User.builder()
                .id("user-123")
                .studentId("2200030001")
                .role(Role.STUDENT)
                .build();

        when(userRepository.findByStudentId("2200030001")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtTokenProvider.generateToken("2200030001")).thenReturn("jwt-token-123");

        AuthResponse authResponse = userService.studentLogin(request);

        assertNotNull(authResponse);
        assertEquals("jwt-token-123", authResponse.getToken());
        verify(moodleTokenCache).storeToken("user-123", "moodle-token-xyz");
        verify(syncService).syncUserAssignments(user, "moodle-token-xyz");
    }

    @Test
    void testStudentLogin_InvalidCredentials() {
        StudentLoginRequest request = new StudentLoginRequest();
        request.setStudentId("2200030001");
        request.setLmsPassword("wrong-pass");

        when(lmsAuthService.authenticateAndGetToken("2200030001", "wrong-pass"))
                .thenThrow(new BadCredentialsException("Invalid Student ID or password."));

        assertThrows(BadCredentialsException.class, () -> userService.studentLogin(request));
        verify(moodleTokenCache, never()).storeToken(any(), any());
        verify(syncService, never()).syncUserAssignments(any(), any());
    }
}
