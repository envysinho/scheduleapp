package com.example.schedule.dto;

import com.example.schedule.entity.ScheduleSlot;
import com.example.schedule.model.ScheduleWeekday;
import com.example.schedule.model.SubShift;
import com.example.schedule.model.TeacherShift;

public record ScheduleSlotResponse(
        Long id,
        Long courseId,
        String courseCode,
        String courseName,
        Long teacherId,
        String teacherName,
        Long spaceId,
        String spaceName,
        Integer cycle,
        TeacherShift shift,
        SubShift subShift,
        Long assignmentId,
        boolean automaticWeekday,
        ScheduleWeekday weekday,
        String startTime,
        String endTime
) {

    public static ScheduleSlotResponse from(ScheduleSlot slot) {
        return new ScheduleSlotResponse(
                slot.getId(),
                slot.getCourse().getId(),
                slot.getCourse().getCode(),
                slot.getCourse().getName(),
                slot.getTeacher().getId(),
                teacherName(slot),
                slot.getSpace() == null ? null : slot.getSpace().getId(),
                slot.getSpace() == null ? null : slot.getSpace().getName(),
                slot.getCycle(),
                slot.getShift(),
                slot.getSubShift(),
                slot.getAssignmentId(),
                slot.isAutomaticWeekday(),
                slot.getWeekday(),
                slot.getStartTime().toString(),
                slot.getEndTime().toString());
    }

    private static String teacherName(ScheduleSlot slot) {
        return (slot.getTeacher().getFirstName() + " " + slot.getTeacher().getLastName()).trim();
    }
}
