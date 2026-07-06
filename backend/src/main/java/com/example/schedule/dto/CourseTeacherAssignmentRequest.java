package com.example.schedule.dto;

import com.example.schedule.model.TeacherShift;

import jakarta.validation.constraints.NotNull;

public record CourseTeacherAssignmentRequest(
        @NotNull Long courseId,
        @NotNull TeacherShift shift
) {
}
