package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.dto.AuthResponse;
import com.klu.assignmenttracker.dto.LoginRequest;
import com.klu.assignmenttracker.dto.StudentLoginRequest;
import com.klu.assignmenttracker.dto.UserResponse;
import com.klu.assignmenttracker.exception.LmsUnavailableException;
import com.klu.assignmenttracker.exception.ResourceNotFoundException;
import com.klu.assignmenttracker.model.Role;
import com.klu.assignmenttracker.model.User;
import com.klu.assignmenttracker.repository.UserRepository;
import com.klu.assignmenttracker.security.JwtTokenProvider;
import com.klu.assignmenttracker.security.MoodleTokenCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Business logic for student login, admin login, and profile management.
 *
 * <h2>Student authentication model</h2>
 * Students are identified by their KLU Student ID and authenticate with
 * their KLU LMS (Moodle) password.  The LMS password is validated during
 * login but is <strong>never stored</strong> in MongoDB.  Each student's
 * record contains only: studentId, role, status, createdAt, lastLogin.
 *
 * <h2>Admin authentication model</h2>
 * Admins log in with an email address and a BCrypt-hashed password stored
 * in MongoDB.  This uses Spring Security's standard {@code AuthenticationManager}.
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final LmsAuthService lmsAuthService;
    private final SyncService syncService;
    private final MoodleTokenCache moodleTokenCache;

    public UserService(UserRepository userRepository,
                       JwtTokenProvider jwtTokenProvider,
                       AuthenticationManager authenticationManager,
                       LmsAuthService lmsAuthService,
                       SyncService syncService,
                       MoodleTokenCache moodleTokenCache) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
        this.lmsAuthService = lmsAuthService;
        this.syncService = syncService;
        this.moodleTokenCache = moodleTokenCache;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Student Login
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Authenticate a student using their KLU Student ID and LMS password,
     * obtain a Moodle Web Service token, and synchronize courses & assignments.
     *
     * <p>Flow:
     * <ol>
     *   <li>Authenticate with KLU Moodle token endpoint and receive Moodle token.</li>
     *   <li>Find-or-create the student record by Student ID in MongoDB.</li>
     *   <li>Store Moodle token in transient in-memory cache (never saved in MongoDB).</li>
     *   <li>Sync student's enrolled courses and assignments from KLU Moodle.</li>
     *   <li>Update {@code lastLogin} timestamp.</li>
     *   <li>Generate a JWT whose subject is the {@code studentId}.</li>
     * </ol>
     *
     * <p><strong>Security guarantees:</strong>
     * <ul>
     *   <li>The LMS password is NEVER saved to MongoDB.</li>
     *   <li>The LMS password is NEVER logged (not even at DEBUG level).</li>
     *   <li>The LMS password is NEVER returned in the response.</li>
     *   <li>The Moodle token is stored only in-memory and never written to MongoDB.</li>
     * </ul>
     */
    public static final String SUPER_ADMIN_STUDENT_ID = "2500032102";

    /**
     * Authenticate a student using their KLU Student ID and LMS password,
     * obtain a Moodle Web Service token, and synchronize courses & assignments.
     *
     * <p>Role Determination:
     * <ul>
     *   <li>If {@code studentId == "2500032102"}, user is assigned {@link Role#ADMIN} (Super Admin).</li>
     *   <li>All other student IDs are assigned {@link Role#STUDENT}.</li>
     * </ul>
     *
     * @param request contains studentId and lmsPassword (transient)
     * @return JWT token and user profile
     */
    public AuthResponse studentLogin(StudentLoginRequest request) {
        String studentId = request.getStudentId() != null ? request.getStudentId().trim() : "";
        boolean isSuperAdmin = SUPER_ADMIN_STUDENT_ID.equals(studentId);
        Role targetRole = isSuperAdmin ? Role.ADMIN : Role.STUDENT;

        String moodleToken = null;
        boolean lmsAvailable = true;

        // ── Step 1: Authenticate with KLU Moodle Web Services ────────────────
        try {
            moodleToken = lmsAuthService.authenticateAndGetToken(
                    studentId, request.getLmsPassword());
        } catch (BadCredentialsException e) {
            // Moodle was online and explicitly rejected the credentials
            log.info("LMS authentication rejected credentials for studentId={}", studentId);
            throw e;
        } catch (LmsUnavailableException e) {
            log.warn("KLU LMS is temporarily unavailable for studentId={}: {}. Attempting fallback login.",
                    studentId, e.getMessage());
            lmsAvailable = false;
        } catch (Exception e) {
            log.warn("Unexpected error connecting to KLU LMS for studentId={}: {}. Attempting fallback login.",
                    studentId, e.getMessage());
            lmsAvailable = false;
        }

        // ── Step 2: Find or create the student record & assign role ──────────
        Optional<User> existingUserOpt = userRepository.findByStudentId(studentId);

        if (!lmsAvailable && existingUserOpt.isEmpty()) {
            // LMS is down and this is a first-time user who has never logged in before
            throw new LmsUnavailableException(
                    "KLU LMS is temporarily unavailable. Please try logging in again once the KLU LMS database is restored.");
        }

        User user = existingUserOpt.orElseGet(() -> {
            log.info("First login for studentId={}; creating record with role={}.",
                    studentId, targetRole);
            User newStudent = User.builder()
                    .studentId(studentId)
                    .role(targetRole)
                    .build();
            return userRepository.save(newStudent);
        });

        // Enforce that ONLY 2500032102 holds the ADMIN role
        if (isSuperAdmin && user.getRole() != Role.ADMIN) {
            log.info("Assigning super admin role (ADMIN) to studentId={}", studentId);
            user.setRole(Role.ADMIN);
        } else if (!isSuperAdmin && user.getRole() == Role.ADMIN) {
            log.warn("Revoking admin role for non-superadmin studentId={}", studentId);
            user.setRole(Role.STUDENT);
        }

        // ── Step 3: Store Moodle token in memory cache (if available) ─────────
        if (moodleToken != null && !moodleToken.isBlank()) {
            moodleTokenCache.storeToken(user.getId(), moodleToken);
            moodleTokenCache.storeToken(user.getStudentId(), moodleToken);
        }

        // ── Step 4: Update lastLogin & save user ─────────────────────────────
        user.setLastLogin(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        log.info("Login successful: studentId={}, role={}, lmsAvailable={}",
                savedUser.getStudentId(), savedUser.getRole(), lmsAvailable);

        // ── Step 5: Asynchronously Synchronize Courses & Assignments ─────────
        // Run in background if Moodle token is present
        if (moodleToken != null && !moodleToken.isBlank()) {
            try {
                syncService.syncUserAssignmentsAsync(savedUser, moodleToken);
            } catch (Exception e) {
                log.warn("Could not dispatch background Moodle sync for studentId={}: {}",
                        savedUser.getStudentId(), e.getMessage());
            }
        }

        // ── Step 6: Issue JWT with studentId as subject ──────────────────────
        String token = jwtTokenProvider.generateToken(savedUser.getStudentId());

        return AuthResponse.builder()
                .token(token)
                .user(UserResponse.fromUser(savedUser))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin Login (unchanged)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Authenticate an admin using email and BCrypt password.
     * Uses Spring Security's {@code AuthenticationManager} for credential verification.
     *
     * @param request admin's email and password
     * @return JWT token and admin profile
     */
    public AuthResponse login(LoginRequest request) {
        // Spring Security verifies the BCrypt password; throws BadCredentialsException on failure
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        log.info("Admin login successful: email={}", user.getEmail());

        // Admin JWT subject is the email address
        String token = jwtTokenProvider.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .user(UserResponse.fromUser(user))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Profile / shared helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Resolve a user from a JWT subject.
     *
     * <p>Student JWTs carry the {@code studentId} as subject;
     * admin JWTs carry the {@code email} as subject.
     * This method tries both lookups so controllers work uniformly.
     *
     * @param subject the JWT subject (studentId or email)
     * @return the matching User
     */
    public User getUserBySubject(String subject) {
        return userRepository.findByStudentId(subject)
                .or(() -> userRepository.findByEmail(subject))
                .orElseThrow(() -> new ResourceNotFoundException("User", "subject", subject));
    }

    /**
     * Get the currently logged-in user's profile.
     *
     * @param subject JWT subject (studentId or email)
     * @return safe user profile (no password)
     */
    public UserResponse getCurrentUser(String subject) {
        return UserResponse.fromUser(getUserBySubject(subject));
    }

    /**
     * Get all users (admin only).
     */
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific user by MongoDB document ID (admin only).
     */
    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return UserResponse.fromUser(user);
    }
}
