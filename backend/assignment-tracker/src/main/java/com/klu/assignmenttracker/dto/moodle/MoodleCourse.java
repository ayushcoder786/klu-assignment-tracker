package com.klu.assignmenttracker.dto.moodle;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response structure for an enrolled course in core_enrol_get_users_courses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MoodleCourse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("shortname")
    private String shortname;

    @JsonProperty("fullname")
    private String fullname;

    @JsonProperty("displayname")
    private String displayname;

    @JsonProperty("idnumber")
    private String idnumber;

    @JsonProperty("summary")
    private String summary;

    @JsonProperty("startdate")
    private Long startdate;

    @JsonProperty("enddate")
    private Long enddate;

    @JsonProperty("visible")
    private Integer visible;
}
