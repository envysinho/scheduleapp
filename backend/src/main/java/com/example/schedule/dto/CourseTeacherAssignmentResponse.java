package com.example.schedule.dto;

import com.example.schedule.entity.Course;
import com.example.schedule.entity.CourseTeacherAssignment;
import com.example.schedule.entity.Teacher;
import com.example.schedule.model.SubShift;
import com.example.schedule.model.TeacherShift;

public record CourseTeacherAssignmentResponse(
        Long id,
        Long teacherId,
        String teacherName,
        Long courseId,
        String courseName,
        String courseCode,
        Integer cycle,
        TeacherShift shift,
        SubShift subShift
) {

    public static CourseTeacherAssignmentResponse from(CourseTeacherAssignment assignment) {
        Course course = assignment.getCourse();
        Teacher teacher = assignment.getTeacher();
        String teacherName = teacher != null
                ? (teacher.getFirstName() + " " + teacher.getLastName()).strip()
                : null;
        return new CourseTeacherAssignmentResponse(
                assignment.getId(),
                teacher != null ? teacher.getId() : null,
                teacherName,
                course.getId(),
                course.getName(),
                course.getCode(),
                course.getCycle(),
                assignment.getShift(),
                assignment.getSubShift());
    }
}
