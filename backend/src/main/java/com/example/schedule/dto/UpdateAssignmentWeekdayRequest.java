package com.example.schedule.dto;

import com.example.schedule.model.ScheduleWeekday;

public record UpdateAssignmentWeekdayRequest(
        ScheduleWeekday weekday
) {
}
