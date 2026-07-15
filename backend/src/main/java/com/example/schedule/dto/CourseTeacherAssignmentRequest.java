package com.example.schedule.dto;

import com.example.schedule.model.SubShift;
import com.example.schedule.model.TeacherShift;
import com.example.schedule.model.ScheduleWeekday;

import jakarta.validation.constraints.NotNull;

public record CourseTeacherAssignmentRequest(
        @NotNull Long courseId,
        @NotNull TeacherShift shift,
        SubShift subShift,
        ScheduleWeekday weekday
) {
}
