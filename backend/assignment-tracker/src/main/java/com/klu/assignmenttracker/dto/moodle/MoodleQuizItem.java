package com.klu.assignmenttracker.dto.moodle;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Single quiz/test/e-exam returned within {@code mod_quiz_get_quizzes_by_courses}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MoodleQuizItem {

    /** Moodle Quiz instance ID */
    private Long id;

    /** Moodle Course ID */
    private Long course;

    /** Moodle Course Module ID (cmid) - used for direct LMS activity link */
    private Long coursemodule;

    /** Title/name of the exam or quiz */
    private String name;

    /** Instructions or description (HTML) */
    private String intro;

    /** Start/open timestamp in epoch seconds (0 if not set) */
    private Long timeopen;

    /** Due/close timestamp in epoch seconds (0 if not set) */
    private Long timeclose;

    /** Time limit for the exam in seconds (0 if unlimited) */
    private Long timelimit;

    /** Maximum allowed attempts (0 if unlimited) */
    private Integer attempts;

    /** Maximum grade/score */
    private Double grade;

    /** Sum of grades/points */
    private Double sumgrades;

    /** Visibility: 1 if visible, 0 if hidden */
    private Integer visible;
}
