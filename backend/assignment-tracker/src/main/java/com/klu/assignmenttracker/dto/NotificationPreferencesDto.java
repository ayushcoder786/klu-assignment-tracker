package com.klu.assignmenttracker.dto;

import com.klu.assignmenttracker.model.NotificationPreferences;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response / request body for GET and PUT /api/notifications/preferences.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesDto {

    private String id;
    private boolean newAssignment;
    private boolean dueTomorrow;
    private boolean dueToday;
    private boolean overdue;
    private boolean deadlineChanged;
    private LocalDateTime updatedAt;

    public static NotificationPreferencesDto from(NotificationPreferences prefs) {
        return NotificationPreferencesDto.builder()
                .id(prefs.getId())
                .newAssignment(prefs.isNewAssignment())
                .dueTomorrow(prefs.isDueTomorrow())
                .dueToday(prefs.isDueToday())
                .overdue(prefs.isOverdue())
                .deadlineChanged(prefs.isDeadlineChanged())
                .updatedAt(prefs.getUpdatedAt())
                .build();
    }
}
