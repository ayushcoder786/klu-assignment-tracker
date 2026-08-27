package com.klu.assignmenttracker.service;

import com.klu.assignmenttracker.dto.CourseResponse;
import com.klu.assignmenttracker.repository.CourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Business logic for courses.
 * Students can only see their own courses.
 */
@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    /**
     * Get all courses belonging to a specific user.
     * This is safe because we always filter by userId.
     *
     * @param userId the authenticated user's ID
     * @return list of the user's courses
     */
    public List<CourseResponse> getCoursesByUserId(String userId) {
        return courseRepository.findByUserId(userId)
                .stream()
                .map(CourseResponse::fromCourse)
                .collect(Collectors.toList());
    }
}
