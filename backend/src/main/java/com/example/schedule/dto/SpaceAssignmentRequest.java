package com.example.schedule.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SpaceAssignmentRequest(
        @NotBlank String courseName,
        @NotNull @Min(1) @Max(10) Integer cycle
) {
}
