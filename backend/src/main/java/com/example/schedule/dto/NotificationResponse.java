package com.example.schedule.dto;

import java.time.Instant;

import com.example.schedule.entity.ActivityNotification;

public record NotificationResponse(
        Long id,
        String actorUsername,
        String actorName,
        String message,
        Instant createdAt
) {
    public static NotificationResponse from(ActivityNotification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getActorUsername(),
                notification.getActorName(),
                notification.getMessage(),
                notification.getCreatedAt());
    }
}
