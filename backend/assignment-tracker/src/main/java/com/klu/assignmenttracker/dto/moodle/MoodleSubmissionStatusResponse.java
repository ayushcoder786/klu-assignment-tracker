package com.klu.assignmenttracker.dto.moodle;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response structure for mod_assign_get_submission_status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MoodleSubmissionStatusResponse {

    @JsonProperty("lastattempt")
    private LastAttempt lastattempt;

    @JsonProperty("warnings")
    private List<Map<String, Object>> warnings;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LastAttempt {
        @JsonProperty("submission")
        private Submission submission;

        @JsonProperty("submissionsenabled")
        private Boolean submissionsenabled;

        @JsonProperty("locked")
        private Boolean locked;

        @JsonProperty("graded")
        private Boolean graded;

        @JsonProperty("canedit")
        private Boolean canedit;

        @JsonProperty("cansubmit")
        private Boolean cansubmit;

        @JsonProperty("extensionduedate")
        private Long extensionduedate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Submission {
        @JsonProperty("id")
        private Long id;

        @JsonProperty("userid")
        private Long userid;

        @JsonProperty("attemptnumber")
        private Integer attemptnumber;

        @JsonProperty("timecreated")
        private Long timecreated;

        @JsonProperty("timemodified")
        private Long timemodified;

        @JsonProperty("status")
        private String status;

        @JsonProperty("gradingstatus")
        private String gradingstatus;
    }
}
