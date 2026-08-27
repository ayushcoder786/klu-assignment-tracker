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
 * Response structure for Moodle core_webservice_get_site_info.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MoodleSiteInfo {

    @JsonProperty("sitename")
    private String sitename;

    @JsonProperty("username")
    private String username;

    @JsonProperty("firstname")
    private String firstname;

    @JsonProperty("lastname")
    private String lastname;

    @JsonProperty("fullname")
    private String fullname;

    @JsonProperty("lang")
    private String lang;

    @JsonProperty("userid")
    private Long userid;

    @JsonProperty("siteurl")
    private String siteurl;

    @JsonProperty("userpictureurl")
    private String userpictureurl;

    @JsonProperty("functions")
    private List<Map<String, Object>> functions;
}
