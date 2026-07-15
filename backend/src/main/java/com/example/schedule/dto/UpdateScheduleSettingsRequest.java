package com.example.schedule.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateScheduleSettingsRequest(
        @NotNull @Size(min = 1, max = 20) @Valid List<ScheduleBlockDto> blocks) {
}
