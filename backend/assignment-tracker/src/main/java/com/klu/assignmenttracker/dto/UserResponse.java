package com.klu.assignmenttracker.dto;

import com.klu.assignmenttracker.model.Role;
import com.klu.assignmenttracker.model.User;
import com.klu.assignmenttracker.model.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Safe representation of a User for API responses.
 * Password is intentionally NOT included.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;
    private String studentId;
    private String name;
    private String email;
    private Role role;
    private UserStatus status;
    private Instant createdAt;
    private Instant lastLogin;
    private Instant lastSync;

    /**
     * Convert a User model to a UserResponse (safe to return in API).
     * This method ensures we never accidentally send a password to the client.
     */
    public static UserResponse fromUser(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .studentId(user.getStudentId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .lastSync(user.getLastSync())
                .build();
    }
}
