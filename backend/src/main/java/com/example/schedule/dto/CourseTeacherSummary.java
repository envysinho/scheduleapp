package com.example.schedule.dto;

import com.example.schedule.entity.Teacher;
import com.example.schedule.model.TeacherShift;

public record CourseTeacherSummary(
        Long id,
        String fullName,
        String phone,
        TeacherShift shift
) {

    public static CourseTeacherSummary from(Teacher teacher, TeacherShift shift) {
        if (teacher == null) {
            return null;
        }
        return new CourseTeacherSummary(
                teacher.getId(),
                teacher.getFirstName() + " " + teacher.getLastName(),
                teacher.getPhone(),
                shift);
    }
}
