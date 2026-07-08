package com.example.schedule.dto;

import java.util.List;
import java.util.Set;

import com.example.schedule.entity.Course;
import com.example.schedule.entity.CourseTeacherAssignment;
import com.example.schedule.model.CourseAvailability;
import com.example.schedule.model.CourseCycleRules;
import com.example.schedule.model.CourseType;
import com.example.schedule.model.SpaceType;
import com.example.schedule.model.SubShift;
import com.example.schedule.model.TeacherShift;

public record CourseResponse(
        Long id,
        String name,
        String code,
        String semester,
        CourseType type,
        boolean lectivo,
        Integer cycle,
        SpaceType requiredSpaceType,
        CourseAvailability availability,
        CourseTeacherSummary morningTeacher,
        CourseTeacherSummary afternoonTeacher,
        CourseTeacherSummary nightTeacher,
        List<CourseSpaceAssignmentResponse> spaceAssignments,
        List<CourseTeacherAssignmentResponse> teacherAssignments
) {

    public static CourseResponse from(Course course) {
        CourseAvailability availability = computeAvailability(course);
        return new CourseResponse(
                course.getId(),
                course.getName(),
                course.getCode(),
                course.getSemester(),
                course.getType(),
                course.isLectivo(),
                course.getCycle(),
                course.getRequiredSpaceType(),
                availability,
                CourseTeacherSummary.from(course.getMorningTeacher(), TeacherShift.MANANA),
                CourseTeacherSummary.from(course.getAfternoonTeacher(), TeacherShift.TARDE),
                CourseTeacherSummary.from(course.getNightTeacher(), TeacherShift.NOCHE),
                course.getSpaceAssignments().stream()
                        .map(CourseSpaceAssignmentResponse::from)
                        .toList(),
                course.getTeacherAssignments().stream()
                        .map(CourseTeacherAssignmentResponse::from)
                        .toList());
    }

    public static CourseAvailability computeAvailability(Course course) {
        SpaceType requiredSpaceType = course.getRequiredSpaceType();
        Integer cycle = course.getCycle();

        if (requiredSpaceType == SpaceType.LABORATORIO) {
            Set<SubShift> expected = CourseCycleRules.allowedSubShiftsForCourse(cycle, requiredSpaceType);
            if (expected.isEmpty()) {
                return CourseAvailability.LIBRE;
            }
            long filled = course.getTeacherAssignments().stream()
                    .filter(a -> a.getSubShift() != null && expected.contains(a.getSubShift()))
                    .map(CourseTeacherAssignment::getSubShift)
                    .distinct()
                    .count();
            if (filled == 0) {
                return CourseAvailability.LIBRE;
            }
            if (filled == expected.size()) {
                return CourseAvailability.LLENO;
            }
            return CourseAvailability.INCOMPLETO;
        }

        if (CourseCycleRules.isNightOnlyCycle(cycle)) {
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
