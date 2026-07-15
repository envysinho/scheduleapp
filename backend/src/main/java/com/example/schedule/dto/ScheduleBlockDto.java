package com.example.schedule.dto;

import com.example.schedule.entity.ScheduleBlockSetting;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ScheduleBlockDto(
        @NotBlank @Pattern(regexp = "^[A-Z0-9_]{2,40}$") String id,
        @NotBlank @Size(max = 80) String label,
        @NotBlank @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$") String start,
        @NotBlank @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$") String end) {

    public static ScheduleBlockDto from(ScheduleBlockSetting setting) {
        return new ScheduleBlockDto(
                setting.getBlockId(),
                setting.getLabel(),
                formatTime(setting.getStartTime()),
                formatTime(setting.getEndTime()));
    }

    private static String formatTime(java.time.LocalTime time) {
        return String.format("%02d:%02d", time.getHour(), time.getMinute());
    }
}
