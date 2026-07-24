package com.example.schedule.controller;

import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schedule.dto.CourseTeacherAssignmentResponse;
import com.example.schedule.dto.UpdateAssignmentScheduleRequest;
import com.example.schedule.dto.UpdateAssignmentWeekdayRequest;
import com.example.schedule.service.ScheduleService;
import com.example.schedule.service.TeacherService;

@RestController
@RequestMapping("/api/course-teacher-assignments")
public class CourseTeacherAssignmentController {

    private final TeacherService teacherService;
    private final ScheduleService scheduleService;

    public CourseTeacherAssignmentController(TeacherService teacherService, ScheduleService scheduleService) {
        this.teacherService = teacherService;
        this.scheduleService = scheduleService;
    }

    @PatchMapping("/{id}/weekday")
    public CourseTeacherAssignmentResponse updateWeekday(
            @PathVariable("id") Long id,
            @RequestBody UpdateAssignmentWeekdayRequest request) {
        return CourseTeacherAssignmentResponse.from(
                teacherService.updateAssignmentWeekday(id, request.weekday()));
    }

    @PatchMapping("/{id}/schedule")
    public CourseTeacherAssignmentResponse updateSchedule(
            @PathVariable("id") Long id,
            @RequestBody UpdateAssignmentScheduleRequest request) {
        return CourseTeacherAssignmentResponse.from(
                scheduleService.updateAssignmentSchedule(id, request.weekday(), request.startTime(), request.endTime()));
    }
}
