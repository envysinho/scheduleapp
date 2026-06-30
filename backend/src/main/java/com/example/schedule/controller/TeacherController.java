package com.example.schedule.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.schedule.dto.CreateTeacherRequest;
import com.example.schedule.dto.TeacherResponse;
import com.example.schedule.dto.UpdateTeacherRequest;
import com.example.schedule.model.CourseCategory;
import com.example.schedule.model.EmploymentType;
import com.example.schedule.model.TeacherShift;
import com.example.schedule.service.TeacherService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    private final TeacherService teacherService;

    public TeacherController(TeacherService teacherService) {
        this.teacherService = teacherService;
    }

    @GetMapping
    public List<TeacherResponse> listTeachers(
            @RequestParam(required = false) EmploymentType employmentType,
            @RequestParam(required = false) TeacherShift shift,
            @RequestParam(required = false) CourseCategory courseCategory,
            @RequestParam(required = false) Integer cycle) {
        return teacherService.findAll(employmentType, shift, courseCategory, cycle);
    }

    @GetMapping("/{id}")
    public TeacherResponse getTeacher(@PathVariable("id") Long id) {
        return teacherService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeacherResponse createTeacher(@Valid @RequestBody CreateTeacherRequest request) {
        return teacherService.create(request);
    }

    @PutMapping("/{id}")
    public TeacherResponse updateTeacher(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateTeacherRequest request) {
        return teacherService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTeacher(@PathVariable("id") Long id) {
        teacherService.delete(id);
    }
}
