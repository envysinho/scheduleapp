package com.example.schedule.dto;

import com.example.schedule.model.ScheduleWeekday;

public record UpdateAssignmentScheduleRequest(
        ScheduleWeekday weekday,
        String startTime,
        String endTime
) {
}
