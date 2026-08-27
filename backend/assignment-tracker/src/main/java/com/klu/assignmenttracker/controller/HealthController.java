package com.klu.assignmenttracker.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Simple health check endpoint.
 * Public - no authentication required.
 * Can be used by load balancers and monitoring tools to check if the API is running.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    /**
     * GET /api/health
     * Returns a simple status response.
     *
     * Response: { "status": "UP" }
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}
