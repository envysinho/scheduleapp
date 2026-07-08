package com.example.schedule.service;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schedule.dto.NotificationResponse;
import com.example.schedule.entity.ActivityNotification;
import com.example.schedule.entity.User;
import com.example.schedule.repository.ActivityNotificationRepository;
import com.example.schedule.security.UserPrincipal;

@Service
public class NotificationService {

    private final ActivityNotificationRepository repository;

    public NotificationService(ActivityNotificationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> findLatest() {
        return repository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> findAllLogs() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional
    public void record(String message) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return;
        }

        User user = principal.getUser();
        ActivityNotification notification = new ActivityNotification();
        notification.setActorUsername(user.getUsername());
        notification.setActorName(displayName(user));
        notification.setMessage(truncate(message, 255));
        repository.save(notification);
    }

    private String displayName(User user) {
        String fullName = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return fullName.isBlank() ? user.getUsername() : fullName;
    }

    private String truncate(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength - 3) + "...";
    }
}
