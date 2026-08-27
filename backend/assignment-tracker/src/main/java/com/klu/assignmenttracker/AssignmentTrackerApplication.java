package com.klu.assignmenttracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the KLU Assignment Tracker Spring Boot application.
 *
 * {@code @EnableScheduling} activates Spring's scheduled task mechanism.
 * {@code @EnableAsync} activates Spring's asynchronous method execution.
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync
public class AssignmentTrackerApplication {

	public static void main(String[] args) {
		SpringApplication.run(AssignmentTrackerApplication.class, args);
	}

}
