package com.example.schedule.controller;

import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schedule.dto.CourseTeacherAssignmentResponse;
import com.example.schedule.dto.UpdateAssignmentWeekdayRequest;
import com.example.schedule.service.TeacherService;

@RestController
@RequestMapping("/api/course-teacher-assignments")
public class CourseTeacherAssignmentController {

    private final TeacherService teacherService;

    public CourseTeacherAssignmentController(TeacherService teacherService) {
        this.teacherService = teacherService;
    }

    @PatchMapping("/{id}/weekday")
    public CourseTeacherAssignmentResponse updateWeekday(
            @PathVariable("id") Long id,
            @RequestBody UpdateAssignmentWeekdayRequest request) {
        return CourseTeacherAssignmentResponse.from(
                teacherService.updateAssignmentWeekday(id, request.weekday()));
    }
}
