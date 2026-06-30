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

import com.example.schedule.dto.CourseResponse;
import com.example.schedule.dto.CreateCourseRequest;
import com.example.schedule.dto.UpdateCourseRequest;
import com.example.schedule.model.CourseAvailability;
import com.example.schedule.model.CourseType;
import com.example.schedule.model.TeacherShift;
import com.example.schedule.service.CourseService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public List<CourseResponse> listCourses(
            @RequestParam(required = false) CourseType type,
            @RequestParam(required = false) CourseAvailability availability,
            @RequestParam(required = false) TeacherShift shift,
            @RequestParam(required = false) Integer cycle) {
        return courseService.findAll(type, availability, shift, cycle);
    }

    @GetMapping("/{id}")
    public CourseResponse getCourse(@PathVariable("id") Long id) {
        return courseService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CourseResponse createCourse(@Valid @RequestBody CreateCourseRequest request) {
        return courseService.create(request);
    }

    @PutMapping("/{id}")
    public CourseResponse updateCourse(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateCourseRequest request) {
        return courseService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCourse(@PathVariable("id") Long id) {
        courseService.delete(id);
    }
}
