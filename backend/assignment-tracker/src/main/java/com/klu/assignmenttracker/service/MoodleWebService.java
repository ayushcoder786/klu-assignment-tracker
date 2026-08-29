package com.klu.assignmenttracker.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.klu.assignmenttracker.dto.moodle.MoodleAssignmentsResponse;
import com.klu.assignmenttracker.dto.moodle.MoodleCourse;
import com.klu.assignmenttracker.dto.moodle.MoodleQuizAttemptsResponse;
import com.klu.assignmenttracker.dto.moodle.MoodleQuizBestGradeResponse;
import com.klu.assignmenttracker.dto.moodle.MoodleQuizItem;
import com.klu.assignmenttracker.dto.moodle.MoodleQuizzesResponse;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
 *   <li>{@code mod_quiz_get_quizzes_by_courses} — E-Exams/quizzes for enrolled courses.</li>
 *   <li>{@code mod_quiz_get_user_attempts} — Student attempts and completion state for an E-Exam.</li>
 *   <li>{@code mod_quiz_get_user_best_grade} — Student best score/grade for an E-Exam.</li>
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

    /**
     * Get all quizzes/e-exams for the specified course IDs.
     * Uses a resilient multi-strategy approach:
     * 1. mod_quiz_get_quizzes_by_courses (batch + course-by-course fallback)
     * 2. core_course_get_contents (scans course sections for all activities of module type 'quiz')
     * Results are deduplicated and merged by Moodle quiz ID.
     *
     * @param moodleToken active Moodle Web Service token
     * @param courseIds   list of Moodle course IDs
     * @return quizzes grouped or listed in MoodleQuizzesResponse
     */
    public MoodleQuizzesResponse getQuizzes(String moodleToken, List<Long> courseIds) {
        if (courseIds == null || courseIds.isEmpty()) {
            return MoodleQuizzesResponse.builder().quizzes(Collections.emptyList()).build();
        }

        Map<Long, MoodleQuizItem> quizMap = new LinkedHashMap<>();

        // 1. Try batch call for all courses via mod_quiz_get_quizzes_by_courses
        try {
            List<ParamEntry> params = new ArrayList<>();
            for (int i = 0; i < courseIds.size(); i++) {
                params.add(new ParamEntry("courseids[" + i + "]", String.valueOf(courseIds.get(i))));
            }
            String responseBody = executeCall(moodleToken, "mod_quiz_get_quizzes_by_courses", params);
            MoodleQuizzesResponse batchResp = objectMapper.readValue(responseBody, MoodleQuizzesResponse.class);
            if (batchResp != null && batchResp.getQuizzes() != null) {
                for (MoodleQuizItem q : batchResp.getQuizzes()) {
                    if (q != null && q.getId() != null) {
                        quizMap.put(q.getId(), q);
                    }
                }
                log.info("Batch mod_quiz_get_quizzes_by_courses returned {} quizzes across {} courses",
                        quizMap.size(), courseIds.size());
            }
        } catch (Exception batchEx) {
            log.warn("Batch quiz retrieval for {} courses encountered issue ({}), falling back to individual course retrieval: {}",
                    courseIds.size(), batchEx.getClass().getSimpleName(), batchEx.getMessage());
        }

        // 2. Individual course retrieval via mod_quiz_get_quizzes_by_courses (if batch returned nothing or failed)
        if (quizMap.isEmpty()) {
            for (Long courseId : courseIds) {
                if (courseId == null || courseId <= 1) {
                    continue;
                }
                try {
                    List<ParamEntry> singleParam = List.of(new ParamEntry("courseids[0]", String.valueOf(courseId)));
                    String responseBody = executeCall(moodleToken, "mod_quiz_get_quizzes_by_courses", singleParam);
                    MoodleQuizzesResponse singleResp = objectMapper.readValue(responseBody, MoodleQuizzesResponse.class);
                    if (singleResp != null && singleResp.getQuizzes() != null) {
                        for (MoodleQuizItem q : singleResp.getQuizzes()) {
                            if (q != null && q.getId() != null) {
                                quizMap.put(q.getId(), q);
                            }
                        }
                    }
                } catch (Exception courseEx) {
                    log.warn("Could not retrieve mod_quiz quizzes for courseId={}: {}", courseId, courseEx.getMessage());
                }
            }
        }

        // 3. Extract and merge quiz activities from core_course_get_contents for every enrolled course
        for (Long courseId : courseIds) {
            if (courseId == null || courseId <= 1) {
                continue;
            }
            try {
                List<MoodleQuizItem> contentQuizzes = getQuizzesFromCourseContents(moodleToken, courseId);
                for (MoodleQuizItem cq : contentQuizzes) {
                    if (cq == null || cq.getId() == null) {
                        continue;
                    }
                    if (quizMap.containsKey(cq.getId())) {
                        MoodleQuizItem existing = quizMap.get(cq.getId());
                        // Enrich missing fields
                        if ((existing.getCoursemodule() == null || existing.getCoursemodule() <= 0) && cq.getCoursemodule() != null) {
                            existing.setCoursemodule(cq.getCoursemodule());
                        }
                        if ((existing.getTimeopen() == null || existing.getTimeopen() <= 0) && cq.getTimeopen() != null) {
                            existing.setTimeopen(cq.getTimeopen());
                        }
                        if ((existing.getTimeclose() == null || existing.getTimeclose() <= 0) && cq.getTimeclose() != null) {
                            existing.setTimeclose(cq.getTimeclose());
                        }
                        if ((existing.getIntro() == null || existing.getIntro().isBlank()) && cq.getIntro() != null) {
                            existing.setIntro(cq.getIntro());
                        }
                    } else {
                        quizMap.put(cq.getId(), cq);
                    }
                }
            } catch (Exception contentEx) {
                log.warn("Could not extract quizzes from course contents for courseId={}: {}", courseId, contentEx.getMessage());
            }
        }

        log.info("Comprehensive quiz sync completed with {} total unique quizzes across {} courses",
                quizMap.size(), courseIds.size());
        return MoodleQuizzesResponse.builder().quizzes(new ArrayList<>(quizMap.values())).build();
    }

    /**
     * Get all quiz activities from course section contents via {@code core_course_get_contents}.
     *
     * @param moodleToken active Moodle Web Service token
     * @param courseId    Moodle course ID
     * @return list of discovered MoodleQuizItems
     */
    public List<MoodleQuizItem> getQuizzesFromCourseContents(String moodleToken, long courseId) {
        List<ParamEntry> params = List.of(new ParamEntry("courseid", String.valueOf(courseId)));
        try {
            String responseBody = executeCall(moodleToken, "core_course_get_contents", params);
            JsonNode sections = objectMapper.readTree(responseBody);
            if (!sections.isArray()) {
                return Collections.emptyList();
            }

            List<MoodleQuizItem> quizItems = new ArrayList<>();
            for (JsonNode section : sections) {
                JsonNode modules = section.path("modules");
                if (!modules.isArray()) {
                    continue;
                }
                for (JsonNode mod : modules) {
                    String modname = mod.path("modname").asText("");
                    String url = mod.path("url").asText("");
                    if ("quiz".equalsIgnoreCase(modname) || url.contains("/mod/quiz/")) {
                        long cmid = mod.path("id").asLong(0L);
                        long instanceId = mod.path("instance").asLong(0L);
                        long quizId = instanceId > 0 ? instanceId : cmid;
                        if (quizId <= 0) {
                            continue;
                        }

                        String name = mod.path("name").asText("Untitled Quiz");
                        String intro = mod.path("description").asText("");

                        Long timeopen = null;
                        Long timeclose = null;

                        JsonNode dates = mod.path("dates");
                        if (dates.isArray()) {
                            for (JsonNode d : dates) {
                                String label = d.path("label").asText("").toLowerCase();
                                long ts = d.path("timestamp").asLong(0L);
                                if (ts > 0) {
                                    if (label.contains("open") || label.contains("from") || label.contains("start")) {
                                        timeopen = ts;
                                    } else if (label.contains("close") || label.contains("due") || label.contains("until") || label.contains("end")) {
                                        timeclose = ts;
                                    }
                                }
                            }
                        }

                        MoodleQuizItem item = MoodleQuizItem.builder()
                                .id(quizId)
                                .course(courseId)
                                .coursemodule(cmid > 0 ? cmid : null)
                                .name(name)
                                .intro(intro)
                                .timeopen(timeopen)
                                .timeclose(timeclose)
                                .visible(mod.path("visible").asInt(1))
                                .build();

                        quizItems.add(item);
                    }
                }
            }
            log.debug("Course ID {} course contents returned {} quiz activities", courseId, quizItems.size());
            return quizItems;
        } catch (Exception e) {
            log.warn("Could not retrieve course contents for courseId={}: {}", courseId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Get user attempts for a specific quiz/e-exam for the given Moodle user ID.
     *
     * @param moodleToken active Moodle Web Service token
     * @param quizId      the Moodle quiz ID
     * @param userId      the Moodle user ID
     * @return user attempts details
     */
    public MoodleQuizAttemptsResponse getQuizUserAttempts(String moodleToken, long quizId, long userId) {
        List<ParamEntry> params = new ArrayList<>();
        params.add(new ParamEntry("quizid", String.valueOf(quizId)));
        if (userId > 0) {
            params.add(new ParamEntry("userid", String.valueOf(userId)));
        }
        params.add(new ParamEntry("status", "all"));
        params.add(new ParamEntry("includepreviews", "0"));

        try {
            String responseBody = executeCall(moodleToken, "mod_quiz_get_user_attempts", params);
            return objectMapper.readValue(responseBody, MoodleQuizAttemptsResponse.class);
        } catch (Exception e) {
            log.debug("Could not retrieve user attempts for quizId={}, userId={}: {}", quizId, userId, e.getMessage());
            return null;
        }
    }

    /**
     * Overloaded method for backward compatibility.
     */
    public MoodleQuizAttemptsResponse getQuizUserAttempts(String moodleToken, long quizId) {
        return getQuizUserAttempts(moodleToken, quizId, 0L);
    }

    /**
     * Get user best grade for a specific quiz/e-exam.
     *
     * @param moodleToken active Moodle Web Service token
     * @param quizId      the Moodle quiz ID
     * @param userId      the Moodle user ID
     * @return best grade details
     */
    public MoodleQuizBestGradeResponse getQuizUserBestGrade(String moodleToken, long quizId, long userId) {
        List<ParamEntry> params = List.of(
                new ParamEntry("quizid", String.valueOf(quizId)),
                new ParamEntry("userid", String.valueOf(userId))
        );
        try {
            String responseBody = executeCall(moodleToken, "mod_quiz_get_user_best_grade", params);
            return objectMapper.readValue(responseBody, MoodleQuizBestGradeResponse.class);
        } catch (Exception e) {
            log.debug("Could not retrieve best grade for quizId={}, userId={}: {}", quizId, userId, e.getMessage());
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

    private static class ParamEntry {
        private final String key;
        private final String value;

        public ParamEntry(String key, String value) {
            this.key = key;
            this.value = value;
        }

        public String key() {
            return key;
        }

        public String value() {
            return value;
        }
    }
}
