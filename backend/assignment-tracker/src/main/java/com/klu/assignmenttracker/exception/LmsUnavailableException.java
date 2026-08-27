package com.klu.assignmenttracker.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when the KLU LMS (Moodle) Web Services endpoint cannot be reached
 * or returns an unexpected response.
 *
 * <p>Maps to HTTP 503 Service Unavailable — the student should retry later.
 * The exception message is safe to surface to the client (it contains no
 * passwords or internal stack details).
 */
@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class LmsUnavailableException extends RuntimeException {

    public LmsUnavailableException(String message) {
        super(message);
    }

    public LmsUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
