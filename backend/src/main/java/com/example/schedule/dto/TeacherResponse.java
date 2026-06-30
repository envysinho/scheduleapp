package com.example.schedule.dto;

import java.util.List;

import com.example.schedule.entity.Teacher;
import com.example.schedule.model.EmploymentType;
import com.example.schedule.model.TeacherShift;

public record TeacherResponse(
        Long id,
        String firstName,
        String lastName,
        String fullName,
        String email,
        String phone,
        EmploymentType employmentType,
        TeacherShift shift,
        List<TeacherAssignmentResponse> assignments
) {

    public static TeacherResponse from(Teacher teacher) {
        return new TeacherResponse(
                teacher.getId(),
                teacher.getFirstName(),
                teacher.getLastName(),
                teacher.getFirstName() + " " + teacher.getLastName(),
                teacher.getEmail(),
                teacher.getPhone(),
                teacher.getEmploymentType(),
                teacher.getShift(),
                teacher.getAssignments().stream()
                        .map(TeacherAssignmentResponse::from)
                        .toList());
    }
}
