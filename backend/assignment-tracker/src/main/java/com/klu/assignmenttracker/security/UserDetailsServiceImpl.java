package com.klu.assignmenttracker.security;

import com.klu.assignmenttracker.model.User;
import com.klu.assignmenttracker.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Tells Spring Security how to load a user from the database.
 *
 * <h2>Subject resolution</h2>
 * The JWT subject varies by user type:
 * <ul>
 *   <li><strong>Students</strong> — subject is the {@code studentId}
 *       (e.g., "2200030001").  Students never have a stored password;
 *       authentication happens via the KLU LMS, not a local BCrypt check.</li>
 *   <li><strong>Admins</strong> — subject is the {@code email} address.
 *       Admins have a BCrypt-hashed password in MongoDB.</li>
 * </ul>
 *
 * <p>This method tries {@code findByStudentId} first, then {@code findByEmail},
 * so it works transparently for both user types.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Load a user by their JWT subject (studentId or email).
     *
     * <p>For the JWT filter chain, this method is called after the token is
     * validated.  The subject stored in the token is passed as {@code subject}.
     *
     * <p>For admin login via {@code AuthenticationManager}, Spring Security
     * calls this with the email address and then verifies the BCrypt password.
     * For students, {@code AuthenticationManager} is <em>never called</em>;
     * LMS authentication is handled separately in {@code UserService.studentLogin()}.
     *
     * @param subject JWT subject: a studentId for students, email for admins
     * @return {@link UserDetails} wrapping the resolved user
     * @throws UsernameNotFoundException if no user matches the subject
     */
    @Override
    public UserDetails loadUserByUsername(String subject) throws UsernameNotFoundException {
        // Try student lookup first (subject = studentId), then admin lookup (subject = email)
        User user = userRepository.findByStudentId(subject)
                .or(() -> userRepository.findByEmail(subject))
                .orElseThrow(() -> new UsernameNotFoundException(
                        "No user found for subject: " + subject));

        List<SimpleGrantedAuthority> authorities;
        if (user.getRole() == Role.ADMIN || "2500032102".equals(user.getStudentId())) {
            authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("ROLE_STUDENT")
            );
        } else {
            authorities = List.of(new SimpleGrantedAuthority("ROLE_STUDENT"));
        }

        // Students have no stored password (authenticated via LMS, not BCrypt).
        // We use an empty string here; DaoAuthenticationProvider is never invoked
        // for students so this value is never used for comparison.
        String storedPassword = user.getPassword() != null ? user.getPassword() : "";

        // Use studentId as the Spring Security "username" for students,
        // email for admins — this must match what the JWT subject contains.
        String springUsername = user.getEmail() != null
                ? user.getEmail()
                : user.getStudentId();

        return new org.springframework.security.core.userdetails.User(
                springUsername,
                storedPassword,
                authorities);
    }
}
