package com.example.schedule.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schedule.dto.ScheduleResponse;
import com.example.schedule.model.Semester;
import com.example.schedule.service.ScheduleService;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping
    public ScheduleResponse getSchedule(
            @RequestParam(required = false) String semester,
            @RequestParam Integer cycle) {
        return scheduleService.getSchedule(Semester.normalize(semester), cycle);
    }

    @PostMapping("/generate")
    public ScheduleResponse generateSchedule(
            @RequestParam(required = false) String semester,
            @RequestParam Integer cycle) {
        return scheduleService.generate(Semester.normalize(semester), cycle);
    }
}
