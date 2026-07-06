package com.example.schedule.dto;

import java.util.List;

import com.example.schedule.model.CourseType;
import com.example.schedule.model.SpaceType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateCourseRequest(
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Size(max = 50) String code,
        @NotNull CourseType type,
        @NotNull Boolean lectivo,
        @NotNull @Min(1) @Max(10) Integer cycle,
        @NotNull SpaceType requiredSpaceType,
        Long morningTeacherId,
        Long afternoonTeacherId,
        Long nightTeacherId,
        @Valid List<CourseSpaceAssignmentRequest> spaceAssignments
) {
}
