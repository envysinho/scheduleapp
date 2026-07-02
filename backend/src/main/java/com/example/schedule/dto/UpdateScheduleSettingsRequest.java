package com.example.schedule.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateScheduleSettingsRequest(
        @NotNull @Size(min = 6, max = 6) @Valid List<ScheduleBlockDto> blocks) {
}
