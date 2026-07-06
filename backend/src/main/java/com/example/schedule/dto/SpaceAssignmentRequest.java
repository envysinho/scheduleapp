package com.example.schedule.dto;

import com.example.schedule.model.TeacherShift;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record SpaceAssignmentRequest(
        @NotBlank String courseName,
        @Min(1) @Max(10) Integer cycle,
        TeacherShift shift
) {
}
