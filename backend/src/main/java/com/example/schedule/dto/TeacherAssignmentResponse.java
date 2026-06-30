package com.example.schedule.dto;

import com.example.schedule.entity.TeacherAssignment;
import com.example.schedule.model.CourseCategory;

public record TeacherAssignmentResponse(
        Long id,
        String courseName,
        CourseCategory courseCategory,
        Integer cycle
) {

    public static TeacherAssignmentResponse from(TeacherAssignment assignment) {
        return new TeacherAssignmentResponse(
                assignment.getId(),
                assignment.getCourseName(),
                assignment.getCourseCategory(),
                assignment.getCycle());
    }
}
