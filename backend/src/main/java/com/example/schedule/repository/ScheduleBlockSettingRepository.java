package com.example.schedule.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schedule.entity.ScheduleBlockSetting;
import com.example.schedule.model.ScheduleBlockId;

public interface ScheduleBlockSettingRepository extends JpaRepository<ScheduleBlockSetting, ScheduleBlockId> {
}
