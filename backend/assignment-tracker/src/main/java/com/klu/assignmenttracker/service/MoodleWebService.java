package com.klu.assignmenttracker.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.klu.assignmenttracker.dto.moodle.MoodleAssignmentsResponse;
import com.klu.assignmenttracker.dto.moodle.MoodleCourse;
import com.klu.assignmenttracker.dto.moodle.MoodleSiteInfo;
import com.klu.assignmenttracker.dto.moodle.MoodleSubmissionStatusResponse;
import com.klu.assignmenttracker.exception.LmsUnavailableException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.StringJoiner;

/**
 * Service that communicates directly with the official KLU Moodle REST Web Services API.
 *
 * <p>All calls hit: {@code https://lms.kluniversity.in/webservice/rest/server.php}
 * with parameter {@code moodlewsrestformat=json}.
 *
 * <h2>Official Web Service Functions Used:</h2>
 * <ul>
 *   <li>{@code core_webservice_get_site_info} — Student profile, full name, Moodle user ID.</li>
 *   <li>{@code core_enrol_get_users_courses} — Courses student is enrolled in.</li>
 *   <li>{@code mod_assign_get_assignments} — Assignments for courses with due dates, cutoff dates.</li>
 *   <li>{@code mod_assign_get_submission_status} — Submission and completion status.</li>
 * </ul>
 */
@Service
public class MoodleWebService {

    private static final Logger log = LoggerFactory.getLogger(MoodleWebService.class);

    @Value("${app.lms.rest-url:https://lms.kluniversity.in/webservice/rest/server.php}")
    private String restUrl;

    @Value("${app.lms.timeout-seconds:15}")
    private int timeoutSeconds;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private HttpClient httpClient;

    public MoodleWebService() {
    }

    @PostConstruct
    private void init() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(timeoutSeconds))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        log.info("MoodleWebService initialized: restUrl={}, timeout={}s", restUrl, timeoutSeconds);
    }

    /**
     * Get Moodle site and user info for the authenticated token.
     *
     * @param moodleToken active Moodle Web Service token
     * @return MoodleSiteInfo containing Moodle userId, student's fullname, etc.
     */
    public MoodleSiteInfo getSiteInfo(String moodleToken) {
        String responseBody = executeCall(moodleToken, "core_webservice_get_site_info", Collections.emptyList());
        try {
            return objectMapper.readValue(responseBody, MoodleSiteInfo.class);
        } catch (IOException e) {
            log.error("Failed to parse site info response: {}", e.getMessage());
            throw new LmsUnavailableException("Failed to parse Moodle site info response.", e);
        }
    }

    /**
     * Get enrolled courses for a given Moodle user ID.
     *
     * @param moodleToken  active Moodle Web Service token
     * @param moodleUserId numeric Moodle user ID
     * @return list of enrolled courses
     */
    public List<MoodleCourse> getEnrolledCourses(String moodleToken, long moodleUserId) {
        List<ParamEntry> params = List.of(new ParamEntry("userid", String.valueOf(moodleUserId)));
        String responseBody = executeCall(moodleToken, "core_enrol_get_users_courses", params);
        try {
            return objectMapper.readValue(responseBody, new TypeReference<List<MoodleCourse>>() {});
        } catch (IOException e) {
            log.error("Failed to parse enrolled courses response: {}", e.getMessage());
            throw new LmsUnavailableException("Failed to parse Moodle enrolled courses response.", e);
        }
    }

    /**
     * Get assignments for the specified course IDs.
     *
     * @param moodleToken active Moodle Web Service token
     * @param courseIds   list of Moodle course IDs
     * @return assignments grouped by course
     */
    public MoodleAssignmentsResponse getAssignments(String moodleToken, List<Long> courseIds) {
        if (courseIds == null || courseIds.isEmpty()) {
            return MoodleAssignmentsResponse.builder().build();
        }

        List<ParamEntry> params = new ArrayList<>();
        for (int i = 0; i < courseIds.size(); i++) {
            params.add(new ParamEntry("courseids[" + i + "]", String.valueOf(courseIds.get(i))));
        }

        String responseBody = executeCall(moodleToken, "mod_assign_get_assignments", params);
        try {
            return objectMapper.readValue(responseBody, MoodleAssignmentsResponse.class);
        } catch (IOException e) {
            log.error("Failed to parse assignments response: {}", e.getMessage());
            throw new LmsUnavailableException("Failed to parse Moodle assignments response.", e);
        }
    }

    /**
     * Get submission status for a specific assignment.
     *
     * @param moodleToken active Moodle Web Service token
     * @param assignId    the Moodle assignment ID
     * @return submission status details
     */
    public MoodleSubmissionStatusResponse getSubmissionStatus(String moodleToken, long assignId) {
        List<ParamEntry> params = List.of(new ParamEntry("assignid", String.valueOf(assignId)));
        try {
            String responseBody = executeCall(moodleToken, "mod_assign_get_submission_status", params);
            return objectMapper.readValue(responseBody, MoodleSubmissionStatusResponse.class);
        } catch (Exception e) {
            log.warn("Could not retrieve submission status for assignId={}: {}", assignId, e.getMessage());
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal HTTP Call Helper
    // ─────────────────────────────────────────────────────────────────────────

    private String executeCall(String moodleToken, String wsFunction, List<ParamEntry> extraParams) {
        if (moodleToken == null || moodleToken.isBlank()) {
            throw new LmsUnavailableException("Missing Moodle Web Service token.");
        }

        StringJoiner formBuilder = new StringJoiner("&");
        formBuilder.add("wstoken=" + URLEncoder.encode(moodleToken, StandardCharsets.UTF_8));
        formBuilder.add("wsfunction=" + URLEncoder.encode(wsFunction, StandardCharsets.UTF_8));
        formBuilder.add("moodlewsrestformat=json");

        if (extraParams != null) {
            for (ParamEntry entry : extraParams) {
                formBuilder.add(URLEncoder.encode(entry.key(), StandardCharsets.UTF_8)
                        + "=" + URLEncoder.encode(entry.value(), StandardCharsets.UTF_8));
            }
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(restUrl))
                .POST(HttpRequest.BodyPublishers.ofString(formBuilder.toString()))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .build();

        log.debug("Executing Moodle Web Service function: {}", wsFunction);

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            log.error("Network error executing Moodle function {}: {}", wsFunction, e.getMessage());
            throw new LmsUnavailableException("KLU LMS is currently unreachable. Please try again later.", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Moodle request interrupted for function {}", wsFunction);
            throw new LmsUnavailableException("KLU LMS request was interrupted. Please try again.", e);
        }

        if (response.statusCode() != 200) {
            log.warn("Moodle REST endpoint returned HTTP {} for function {}", response.statusCode(), wsFunction);
            throw new LmsUnavailableException("KLU LMS is temporarily unavailable (HTTP " + response.statusCode() + "). Please try again later.");
        }

        String body = response.body();
        if (body == null || body.isBlank()) {
            log.warn("Moodle REST endpoint returned empty body for function {}", wsFunction);
            throw new LmsUnavailableException("KLU LMS returned an empty response.");
        }

        String trimmed = body.trim();
        if (trimmed.startsWith("Error:") || trimmed.contains("Database connection failed")
                || trimmed.contains("<html") || trimmed.contains("<!DOCTYPE")
                || trimmed.contains("Fatal error")) {
            log.warn("KLU LMS external database/server error during function {}: {}", wsFunction,
                    trimmed.length() > 150 ? trimmed.substring(0, 150) : trimmed);
            throw new LmsUnavailableException("KLU LMS is temporarily unavailable (external LMS database connection failed).");
        }

        checkMoodleException(body, wsFunction);
        return body;
    }

    private void checkMoodleException(String responseBody, String wsFunction) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            if (root.isObject() && root.has("exception")) {
                String exception = root.path("exception").asText();
                String errorcode = root.path("errorcode").asText();
                String message = root.path("message").asText();
                log.warn("Moodle returned exception for {}: exception={}, errorcode={}, message={}",
                        wsFunction, exception, errorcode, message);
                throw new LmsUnavailableException("Moodle API error (" + errorcode + "): " + message);
            }
        } catch (IOException ignored) {
            // Handled during higher-level parsing
        }
    }

    private record ParamEntry(String key, String value) {}
}
