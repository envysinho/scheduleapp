package com.example.schedule.dto;

import java.util.List;

public record ScheduleResponse(
        String semester,
        Integer cycle,
        boolean generated,
        boolean stale,
        List<String> warnings,
        List<ScheduleSlotResponse> slots
) {
}
