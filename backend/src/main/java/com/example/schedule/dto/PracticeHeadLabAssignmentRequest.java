package com.example.schedule.dto;

import jakarta.validation.constraints.NotNull;

public record PracticeHeadLabAssignmentRequest(
        @NotNull Long spaceId
) {
}
