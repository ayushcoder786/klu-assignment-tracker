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
        assertNotNull(authResponse.getUser().getLastLogin(), "lastLogin must be set after successful student login");
        assertNotNull(user.getLastLogin(), "User entity lastLogin must be set");
        verify(moodleTokenCache).storeToken("user-123", "moodle-token-xyz");
        verify(syncService).syncUserAssignmentsAsync(user, "moodle-token-xyz");
    }

    @Test
    void testAdminLogin_Success_UpdatesLastLogin() {
        com.klu.assignmenttracker.dto.LoginRequest request = new com.klu.assignmenttracker.dto.LoginRequest();
        request.setEmail("admin@example.com");
        request.setPassword("admin-pass");

        User user = User.builder()
                .id("admin-123")
                .email("admin@example.com")
                .role(Role.ADMIN)
                .build();

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtTokenProvider.generateToken("admin@example.com")).thenReturn("jwt-admin-token");

        AuthResponse authResponse = userService.login(request);

        assertNotNull(authResponse);
        assertEquals("jwt-admin-token", authResponse.getToken());
        assertNotNull(authResponse.getUser().getLastLogin(), "lastLogin must be set after successful admin login");
        assertNotNull(user.getLastLogin(), "Admin user entity lastLogin must be set");
        verify(userRepository).save(user);
    }

    @Test
    void testStudentLogin_SuperAdminRoleAssigned() {
        StudentLoginRequest request = new StudentLoginRequest();
        request.setStudentId("2500032102");
        request.setLmsPassword("super-pass");

        when(lmsAuthService.authenticateAndGetToken("2500032102", "super-pass"))
                .thenReturn("moodle-token-super");

        User user = User.builder()
                .id("user-super")
                .studentId("2500032102")
                .role(Role.ADMIN)
                .build();

        when(userRepository.findByStudentId("2500032102")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtTokenProvider.generateToken("2500032102")).thenReturn("jwt-token-super");

        AuthResponse authResponse = userService.studentLogin(request);

        assertNotNull(authResponse);
        assertEquals(Role.ADMIN, authResponse.getUser().getRole());
        verify(syncService).syncUserAssignmentsAsync(any(User.class), eq("moodle-token-super"));
    }

    @Test
    void testStudentLogin_NonAdminDemotedIfHadAdminRole() {
        StudentLoginRequest request = new StudentLoginRequest();
        request.setStudentId("2200030001");
        request.setLmsPassword("secret-pass");

        when(lmsAuthService.authenticateAndGetToken("2200030001", "secret-pass"))
                .thenReturn("moodle-token-xyz");

        User user = User.builder()
                .id("user-123")
                .studentId("2200030001")
                .role(Role.ADMIN) // Improperly had ADMIN role before
                .build();

        when(userRepository.findByStudentId("2200030001")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtTokenProvider.generateToken("2200030001")).thenReturn("jwt-token-123");

        AuthResponse authResponse = userService.studentLogin(request);

        assertNotNull(authResponse);
        assertEquals(Role.STUDENT, authResponse.getUser().getRole());
    }

    @Test
    void testStudentLogin_InvalidCredentials() {
        StudentLoginRequest request = new StudentLoginRequest();
        request.setStudentId("2200030001");
        request.setLmsPassword("wrong-pass");

        when(lmsAuthService.authenticateAndGetToken("2200030001", "wrong-pass"))
                .thenThrow(new BadCredentialsException("Invalid Student ID or password."));

        assertThrows(BadCredentialsException.class, () -> userService.studentLogin(request));
        verify(userRepository, never()).save(any());
        verify(moodleTokenCache, never()).storeToken(any(), any());
        verify(syncService, never()).syncUserAssignmentsAsync(any(), any());
    }

    @Test
    void testStudentLogin_LmsUnavailable_ExistingUserSucceeds() {
        StudentLoginRequest request = new StudentLoginRequest();
        request.setStudentId("2200030001");
        request.setLmsPassword("any-pass");

        when(lmsAuthService.authenticateAndGetToken("2200030001", "any-pass"))
                .thenThrow(new com.klu.assignmenttracker.exception.LmsUnavailableException(
                        "KLU LMS is temporarily unavailable (external LMS database connection failed)."));

        User user = User.builder()
                .id("user-123")
                .studentId("2200030001")
                .role(Role.STUDENT)
                .build();

        when(userRepository.findByStudentId("2200030001")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtTokenProvider.generateToken("2200030001")).thenReturn("jwt-fallback-token");

        AuthResponse authResponse = userService.studentLogin(request);

        assertNotNull(authResponse);
        assertEquals("jwt-fallback-token", authResponse.getToken());
        assertEquals(Role.STUDENT, authResponse.getUser().getRole());
    }

    @Test
    void testStudentLogin_LmsUnavailable_NewUserThrows() {
        StudentLoginRequest request = new StudentLoginRequest();
        request.setStudentId("9999999999");
        request.setLmsPassword("any-pass");

        when(lmsAuthService.authenticateAndGetToken("9999999999", "any-pass"))
                .thenThrow(new com.klu.assignmenttracker.exception.LmsUnavailableException(
                        "KLU LMS is temporarily unavailable (external LMS database connection failed)."));

        when(userRepository.findByStudentId("9999999999")).thenReturn(Optional.empty());

        assertThrows(com.klu.assignmenttracker.exception.LmsUnavailableException.class,
                () -> userService.studentLogin(request));
    }
}
