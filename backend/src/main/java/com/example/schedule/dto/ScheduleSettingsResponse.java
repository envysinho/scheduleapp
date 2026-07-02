package com.example.schedule.dto;

import java.util.List;

public record ScheduleSettingsResponse(
        List<ScheduleBlockDto> blocks,
        List<String> weekdays) {
}
