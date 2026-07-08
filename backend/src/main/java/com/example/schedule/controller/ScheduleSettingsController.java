package com.example.schedule.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schedule.dto.ScheduleSettingsResponse;
import com.example.schedule.dto.UpdateScheduleSettingsRequest;
import com.example.schedule.model.Semester;
import com.example.schedule.service.ScheduleSettingsService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/schedule-settings")
public class ScheduleSettingsController {

    private final ScheduleSettingsService scheduleSettingsService;

    public ScheduleSettingsController(ScheduleSettingsService scheduleSettingsService) {
        this.scheduleSettingsService = scheduleSettingsService;
    }

    @GetMapping
    public ScheduleSettingsResponse getSettings(@RequestParam(required = false) String semester) {
        return scheduleSettingsService.getSettings(Semester.normalize(semester));
    }

    @PutMapping
    public ScheduleSettingsResponse updateSettings(
            @RequestParam(required = false) String semester,
            @Valid @RequestBody UpdateScheduleSettingsRequest request) {
        return scheduleSettingsService.updateSettings(Semester.normalize(semester), request);
    }
}
