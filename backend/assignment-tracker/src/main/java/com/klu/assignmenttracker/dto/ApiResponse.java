package com.klu.assignmenttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic API response wrapper.
 * Used to give consistent responses for success and error cases.
 *
 * @param <T> the type of data in the response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    /** true if the request was successful, false if there was an error */
    private boolean success;

    /** A human-readable message */
    private String message;

    /** The actual response data (null for error responses) */
    private T data;

    /** Convenience method for a successful response */
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    /** Convenience method for an error response */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }
}
