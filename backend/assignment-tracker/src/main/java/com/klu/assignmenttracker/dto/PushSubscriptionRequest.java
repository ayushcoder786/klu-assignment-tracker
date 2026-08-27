package com.klu.assignmenttracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for POST /api/notifications/subscribe.
 * Contains the Web Push subscription fields from the browser.
 *
 * SECURITY: This DTO never carries LMS passwords or Moodle tokens.
 */
@Data
public class PushSubscriptionRequest {

    @NotBlank(message = "Endpoint is required")
    private String endpoint;

    @NotBlank(message = "p256dh key is required")
    private String p256dh;

    @NotBlank(message = "auth key is required")
    private String auth;
}
