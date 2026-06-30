package com.example.schedule.dto;

import com.example.schedule.entity.CourseSpaceAssignment;

public record CourseSpaceAssignmentResponse(
        Long id,
        Long spaceId,
        String spaceName
) {

    public static CourseSpaceAssignmentResponse from(CourseSpaceAssignment assignment) {
        return new CourseSpaceAssignmentResponse(
                assignment.getId(),
                assignment.getSpace().getId(),
                assignment.getSpace().getName());
    }
}
