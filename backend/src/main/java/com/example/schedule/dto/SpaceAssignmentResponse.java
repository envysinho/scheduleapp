package com.example.schedule.dto;

import com.example.schedule.entity.SpaceAssignment;
import com.example.schedule.model.SubShift;
import com.example.schedule.model.TeacherShift;

public record SpaceAssignmentResponse(
        Long id,
        String courseName,
        Integer cycle,
        TeacherShift shift,
        SubShift subShift
) {

    public static SpaceAssignmentResponse from(SpaceAssignment assignment) {
        return new SpaceAssignmentResponse(
                assignment.getId(),
                assignment.getCourseName(),
                assignment.getCycle(),
                assignment.getShift(),
                assignment.getSubShift());
    }
}
