package com.klu.assignmenttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response body for successful login or registration.
 * Contains the JWT token the client should save and send with future requests.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    /** The JWT token - send this in the Authorization header as: Bearer {token} */
    private String token;

    /** Always "Bearer" */
    @Builder.Default
    private String type = "Bearer";

    /** Basic info about the logged-in user (no password!) */
    private UserResponse user;
}
