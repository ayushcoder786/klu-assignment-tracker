package com.klu.assignmenttracker.controller;

import com.klu.assignmenttracker.dto.SyncResponse;
import com.klu.assignmenttracker.service.SyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Handles sync requests - triggers fetching assignments from Moodle.
 * Requires authentication.
 */
@RestController
@RequestMapping("/api")
public class SyncController {

    private final SyncService syncService;

    public SyncController(SyncService syncService) {
        this.syncService = syncService;
    }

    /**
     * POST /api/sync
     * Trigger a Moodle sync for the currently logged-in student.
     * NOTE: Moodle API is not yet connected - returns a SKIPPED status.
     */
    @PostMapping("/sync")
    public ResponseEntity<SyncResponse> sync(@AuthenticationPrincipal UserDetails userDetails) {
        SyncResponse response = syncService.triggerSync(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
