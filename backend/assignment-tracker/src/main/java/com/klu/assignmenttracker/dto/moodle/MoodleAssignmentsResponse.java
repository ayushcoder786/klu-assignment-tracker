package com.klu.assignmenttracker.dto.moodle;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Root response object for mod_assign_get_assignments.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MoodleAssignmentsResponse {

    @JsonProperty("courses")
    @Builder.Default
    private List<MoodleAssignmentCourse> courses = new ArrayList<>();

    @JsonProperty("warnings")
    @Builder.Default
    private List<Map<String, Object>> warnings = new ArrayList<>();
}
