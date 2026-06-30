package com.example.schedule.dto;

import com.example.schedule.model.CourseCategory;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TeacherAssignmentRequest(
        @NotBlank String courseName,
        @NotNull CourseCategory courseCategory,
        @NotNull @Min(1) @Max(10) Integer cycle
) {
}
