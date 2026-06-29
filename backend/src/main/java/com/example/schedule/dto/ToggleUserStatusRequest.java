package com.example.schedule.dto;

import jakarta.validation.constraints.NotNull;

public record ToggleUserStatusRequest(@NotNull Boolean enabled) {
}
