package com.klu.assignmenttracker.dto;

import com.klu.assignmenttracker.model.Course;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * API response representing a Course.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {

    private String id;
    private String userId;
    private String moodleCourseId;
    private String name;
    private String shortName;

    /** Convert a Course model to a CourseResponse DTO */
    public static CourseResponse fromCourse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .userId(course.getUserId())
                .moodleCourseId(course.getMoodleCourseId())
                .name(course.getName())
                .shortName(course.getShortName())
                .build();
    }
}
