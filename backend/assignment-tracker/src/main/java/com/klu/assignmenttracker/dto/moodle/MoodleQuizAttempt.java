package com.klu.assignmenttracker.dto.moodle;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Single quiz attempt from {@code mod_quiz_get_user_attempts}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MoodleQuizAttempt {

    /** Attempt ID */
    private Long id;

    /** Quiz ID */
    private Long quiz;

    /** Moodle User ID */
    private Long userid;

    /** Attempt sequential number (1, 2, ...) */
    private Integer attempt;

    /** State of the attempt: "finished", "inprogress", "abandoned", etc. */
    private String state;

    /** Start timestamp in epoch seconds */
    private Long timestart;

    /** Finish timestamp in epoch seconds (0 if not finished) */
    private Long timefinish;

    /** Sum of grades/score obtained in this attempt */
    private Double sumgrades;
}
