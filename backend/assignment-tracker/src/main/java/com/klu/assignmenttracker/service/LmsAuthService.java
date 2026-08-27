package com.klu.assignmenttracker.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.klu.assignmenttracker.exception.LmsUnavailableException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

/**
 * Validates student credentials against the KLU LMS (Moodle) Web Services API.
 *
 * <h2>Endpoint</h2>
 * {@code POST https://lms.kluniversity.in/login/token.php}
 * with {@code Content-Type: application/x-www-form-urlencoded}
 *
 * <h2>Security design</h2>
 * <ul>
 *   <li>The LMS password is sent as a POST body field, NOT as a URL query parameter,
 *       so it never appears in access logs or URL traces.</li>
 *   <li>The password is NEVER logged — not even at TRACE or DEBUG level.</li>
 *   <li>The Moodle {@code token} returned on success is checked for presence only
 *       and then immediately discarded — it is NEVER stored in MongoDB, cached,
 *       or returned to the frontend.</li>
 *   <li>Only the {@code studentId} and a boolean success/failure flag leave this class.</li>
 * </ul>
 *
 * <h2>Response format</h2>
 * <pre>
 *   Success → {"token": "abc123...", "privatetoken": "..."}
 *   Failure → {"error": "Invalid login, please try again", "errorcode": "invalidlogin"}
 * </pre>
 * Moodle always returns HTTP 200; success/failure is determined by the JSON body.
 */
@Service
public class LmsAuthService {

    private static final Logger log = LoggerFactory.getLogger(LmsAuthService.class);

    /** KLU Moodle Web Services token endpoint. Configured in application.properties. */
    @Value("${app.lms.token-url}")
    private String tokenUrl;

    /** Moodle web service name. The mobile app service is always enabled. */
    @Value("${app.lms.service:moodle_mobile_app}")
    private String moodleService;

    /** HTTP timeout in seconds for LMS calls. */
    @Value("${app.lms.timeout-seconds:10}")
    private int timeoutSeconds;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Shared, thread-safe HttpClient — initialized once after @Value injection. */
    private HttpClient httpClient;

    public LmsAuthService() {
    }

    @PostConstruct
    private void init() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(timeoutSeconds))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        log.info("LmsAuthService initialized: tokenUrl={}, service={}, timeout={}s",
                tokenUrl, moodleService, timeoutSeconds);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Authenticate a student's KLU LMS credentials against Moodle and return the Moodle token.
     *
     * <p><strong>Security contract:</strong>
     * <ul>
     *   <li>The {@code lmsPassword} is NEVER written to any log line.</li>
     *   <li>The {@code lmsPassword} is placed in the POST body, NOT the URL.</li>
     *   <li>The returned Moodle token is handled in memory only (never written to MongoDB).</li>
     * </ul>
     *
     * @param studentId   the KLU student ID used as the Moodle username
     * @param lmsPassword the student's KLU LMS password (transient)
     * @return the Moodle Web Service token string
     * @throws BadCredentialsException if credentials are explicitly rejected by Moodle
     * @throws LmsUnavailableException if the LMS cannot be reached or times out
     */
    public String authenticateAndGetToken(String studentId, String lmsPassword) {
        // ── Build POST body — password stays out of the URL and out of logs ───
        String formBody = "username=" + URLEncoder.encode(studentId, StandardCharsets.UTF_8)
                + "&password=" + URLEncoder.encode(lmsPassword, StandardCharsets.UTF_8)
                + "&service="  + URLEncoder.encode(moodleService, StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(tokenUrl))
                .POST(HttpRequest.BodyPublishers.ofString(formBody))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .build();

        // ── Send request ───────────────────────────────────────────────────────
        log.debug("Sending LMS auth request for studentId={}", studentId);

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            log.error("Network error reaching KLU LMS for studentId={}: {}", studentId, e.getMessage());
            throw new LmsUnavailableException(
                    "KLU LMS is currently unreachable. Please try again later.", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("LMS request interrupted for studentId={}", studentId);
            throw new LmsUnavailableException(
                    "KLU LMS request was interrupted. Please try again.", e);
        }

        // ── Parse response ─────────────────────────────────────────────────────
        if (response.statusCode() != 200) {
            log.warn("LMS token endpoint returned unexpected HTTP {} for studentId={}",
                    response.statusCode(), studentId);
            throw new LmsUnavailableException(
                    "KLU LMS returned an unexpected response. Please try again later.");
        }

        Map<String, Object> body;
        try {
            body = objectMapper.readValue(response.body(),
                    new TypeReference<Map<String, Object>>() {});
        } catch (IOException e) {
            log.error("Failed to parse LMS response for studentId={}: {}", studentId, e.getMessage());
            throw new LmsUnavailableException(
                    "KLU LMS returned an unrecognised response. Please try again later.");
        }

        // ── Evaluate result ────────────────────────────────────────────────────
        if (body.containsKey("token")) {
            String token = (String) body.get("token");
            log.info("LMS authentication successful for studentId={}", studentId);
            return token;
        }

        // FAILURE — determine whether it is a credential error or an LMS error.
        String errorCode = (String) body.get("errorcode");

        if ("invalidlogin".equals(errorCode)) {
            log.info("LMS authentication failed: invalid credentials for studentId={}", studentId);
            throw new BadCredentialsException("Invalid Student ID or password.");
        }

        log.warn("LMS token endpoint returned unexpected errorcode={} for studentId={}",
                errorCode, studentId);
        throw new LmsUnavailableException(
                "KLU LMS authentication is temporarily unavailable (code: "
                        + errorCode + "). Please try again later.");
    }

    /**
     * Validate a student's KLU LMS credentials by calling the Moodle token endpoint.
     *
     * @param studentId   the KLU student ID used as the Moodle username
     * @param lmsPassword the student's KLU LMS password
     * @return {@code true} if Moodle confirms credentials, {@code false} if invalid
     */
    public boolean validateCredentials(String studentId, String lmsPassword) {
        try {
            authenticateAndGetToken(studentId, lmsPassword);
            return true;
        } catch (BadCredentialsException e) {
            return false;
        }
    }
}
