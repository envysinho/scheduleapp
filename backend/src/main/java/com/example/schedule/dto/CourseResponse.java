package com.example.schedule.dto;

import java.util.List;

import com.example.schedule.entity.Course;
import com.example.schedule.model.CourseAvailability;
import com.example.schedule.model.CourseCycleRules;
import com.example.schedule.model.CourseType;
import com.example.schedule.model.TeacherShift;

public record CourseResponse(
        Long id,
        String name,
        String code,
        CourseType type,
        boolean lectivo,
        Integer cycle,
        CourseAvailability availability,
        CourseTeacherSummary morningTeacher,
        CourseTeacherSummary afternoonTeacher,
        CourseTeacherSummary nightTeacher,
        List<CourseSpaceAssignmentResponse> spaceAssignments
) {

    public static CourseResponse from(Course course) {
        CourseAvailability availability = computeAvailability(course);
        return new CourseResponse(
                course.getId(),
                course.getName(),
                course.getCode(),
                course.getType(),
                course.isLectivo(),
                course.getCycle(),
                availability,
                CourseTeacherSummary.from(course.getMorningTeacher(), TeacherShift.MANANA),
                CourseTeacherSummary.from(course.getAfternoonTeacher(), TeacherShift.TARDE),
                CourseTeacherSummary.from(course.getNightTeacher(), TeacherShift.NOCHE),
                course.getSpaceAssignments().stream()
                        .map(CourseSpaceAssignmentResponse::from)
                        .toList());
    }

    public static CourseAvailability computeAvailability(Course course) {
        if (CourseCycleRules.isNightOnlyCycle(course.getCycle())) {
            return course.getNightTeacher() != null
                    ? CourseAvailability.LLENO
                    : CourseAvailability.LIBRE;
        }

        boolean hasMorning = course.getMorningTeacher() != null;
        boolean hasAfternoon = course.getAfternoonTeacher() != null;
        if (!hasMorning && !hasAfternoon) {
            return CourseAvailability.LIBRE;
        }
        if (hasMorning && hasAfternoon) {
            return CourseAvailability.LLENO;
        }
        return CourseAvailability.INCOMPLETO;
    }
}
