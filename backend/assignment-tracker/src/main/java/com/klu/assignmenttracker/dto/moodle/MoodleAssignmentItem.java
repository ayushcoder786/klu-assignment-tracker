package com.klu.assignmenttracker.dto.moodle;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a single assignment object from mod_assign_get_assignments.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MoodleAssignmentItem {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("cmid")
    private Long cmid;

    @JsonProperty("course")
    private Long course;

    @JsonProperty("name")
    private String name;

    @JsonProperty("nosubmissions")
    private Integer nosubmissions;

    @JsonProperty("duedate")
    private Long duedate;

    @JsonProperty("allowsubmissionsfromdate")
    private Long allowsubmissionsfromdate;

    @JsonProperty("grade")
    private Double grade;

    @JsonProperty("timemodified")
    private Long timemodified;

    @JsonProperty("cutoffdate")
    private Long cutoffdate;

    @JsonProperty("gradingduedate")
    private Long gradingduedate;

    @JsonProperty("intro")
    private String intro;

    @JsonProperty("introformat")
    private Integer introformat;
}
