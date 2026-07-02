package com.example.schedule.dto;

import com.example.schedule.entity.ScheduleBlockSetting;
import com.example.schedule.model.ScheduleBlockId;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record ScheduleBlockDto(
        @NotNull ScheduleBlockId id,
        @NotBlank String label,
        @NotBlank @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$") String start,
        @NotBlank @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$") String end) {

    public static ScheduleBlockDto from(ScheduleBlockSetting setting, String label) {
        return new ScheduleBlockDto(
                setting.getBlockId(),
                label,
                formatTime(setting.getStartTime()),
                formatTime(setting.getEndTime()));
    }

    private static String formatTime(java.time.LocalTime time) {
        return String.format("%02d:%02d", time.getHour(), time.getMinute());
    }
}
