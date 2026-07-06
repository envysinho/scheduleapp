package com.example.schedule.dto;

import com.example.schedule.entity.Course;
import com.example.schedule.entity.CourseTeacherAssignment;
import com.example.schedule.model.TeacherShift;

public record CourseTeacherAssignmentResponse(
        Long id,
        Long courseId,
        String courseName,
        String courseCode,
        Integer cycle,
        TeacherShift shift
) {

    public static CourseTeacherAssignmentResponse from(CourseTeacherAssignment assignment) {
        Course course = assignment.getCourse();
        return new CourseTeacherAssignmentResponse(
                assignment.getId(),
                course.getId(),
                course.getName(),
                course.getCode(),
                course.getCycle(),
                assignment.getShift());
    }
}
