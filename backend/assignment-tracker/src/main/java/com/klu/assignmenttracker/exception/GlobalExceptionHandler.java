package com.klu.assignmenttracker.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Catches exceptions thrown by controllers and returns clean JSON error responses.
 * This prevents stack traces from leaking to API clients.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle 404 Not Found errors.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    /**
     * Handle 400 Bad Request errors (duplicate email, invalid input, etc.).
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(BadRequestException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /**
     * Handle 401 Unauthorized — wrong Student ID/password or invalid token.
     * The message from the exception is safe to surface (it's set by our own code).
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        // Do NOT log the password or include it in the response
        String message = (ex.getMessage() != null)
                ? ex.getMessage()
                : "Invalid Student ID or password.";
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, message);
    }

    /**
     * Handle 503 Service Unavailable — KLU LMS is unreachable or returned an error.
     * The exception message is safe (set by LmsAuthService, contains no passwords).
     */
    @ExceptionHandler(LmsUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleLmsUnavailable(LmsUnavailableException ex) {
        log.warn("LMS unavailable: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
    }

    /**
     * Handle 403 Forbidden - user is authenticated but doesn't have permission.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, "Access denied");
    }

    /**
     * Handle validation errors from @Valid annotations on request bodies.
     * Returns a map of field names to error messages.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validation Failed");
        body.put("errors", fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Catch-all handler for any unexpected errors.
     * Logs the error but returns a generic message to avoid leaking internals.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred. Please try again.");
    }

    /** Helper method to build a consistent error response body */
    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
