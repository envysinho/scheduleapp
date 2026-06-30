package com.example.schedule.dto;

import jakarta.validation.constraints.NotNull;

public record CourseSpaceAssignmentRequest(
        @NotNull Long spaceId
) {
}
