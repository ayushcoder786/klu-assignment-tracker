package com.klu.assignmenttracker.dto.moodle;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a course wrapper in mod_assign_get_assignments response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MoodleAssignmentCourse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("fullname")
    private String fullname;

    @JsonProperty("shortname")
    private String shortname;

    @JsonProperty("timemodified")
    private Long timemodified;

    @JsonProperty("assignments")
    @Builder.Default
    private List<MoodleAssignmentItem> assignments = new ArrayList<>();
}
