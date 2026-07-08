package com.example.schedule.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schedule.entity.ActivityNotification;

public interface ActivityNotificationRepository extends JpaRepository<ActivityNotification, Long> {

    List<ActivityNotification> findTop20ByOrderByCreatedAtDesc();

    List<ActivityNotification> findAllByOrderByCreatedAtDesc();
}
