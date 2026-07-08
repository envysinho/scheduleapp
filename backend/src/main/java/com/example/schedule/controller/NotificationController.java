package com.example.schedule.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schedule.dto.NotificationResponse;
import com.example.schedule.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponse> listNotifications() {
        return notificationService.findLatest();
    }

    @GetMapping("/logs")
    public List<NotificationResponse> listNotificationLogs() {
        return notificationService.findAllLogs();
    }
}
