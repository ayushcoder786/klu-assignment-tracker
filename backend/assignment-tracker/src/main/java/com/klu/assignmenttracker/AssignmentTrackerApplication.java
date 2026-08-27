package com.klu.assignmenttracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the KLU Assignment Tracker Spring Boot application.
 *
 * {@code @EnableScheduling} activates Spring's scheduled task mechanism,
 * allowing {@code @Scheduled} methods (e.g. in NotificationSchedulerService)
 * to run automatically at the configured interval.
 */
@SpringBootApplication
@EnableScheduling
public class AssignmentTrackerApplication {

	public static void main(String[] args) {
		SpringApplication.run(AssignmentTrackerApplication.class, args);
	}

}
