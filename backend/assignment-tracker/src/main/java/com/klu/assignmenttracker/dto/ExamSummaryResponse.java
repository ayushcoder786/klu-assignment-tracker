package com.klu.assignmenttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary statistics for a student's E-Exams.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamSummaryResponse {

    private int total;
    private int given;
    private int pending;
    private int overdue;
}
