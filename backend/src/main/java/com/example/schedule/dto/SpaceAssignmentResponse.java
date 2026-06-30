package com.example.schedule.dto;

import com.example.schedule.entity.SpaceAssignment;

public record SpaceAssignmentResponse(
        Long id,
        String courseName,
        Integer cycle
) {

    public static SpaceAssignmentResponse from(SpaceAssignment assignment) {
        return new SpaceAssignmentResponse(
                assignment.getId(),
                assignment.getCourseName(),
                assignment.getCycle());
    }
}
