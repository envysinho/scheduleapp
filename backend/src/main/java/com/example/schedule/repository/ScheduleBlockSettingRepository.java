package com.example.schedule.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schedule.entity.ScheduleBlockSetting;
import com.example.schedule.model.ScheduleBlockId;
import com.example.schedule.model.ScheduleBlockSettingId;

public interface ScheduleBlockSettingRepository extends JpaRepository<ScheduleBlockSetting, ScheduleBlockSettingId> {

    List<ScheduleBlockSetting> findBySemester(String semester);

    long countBySemester(String semester);
}
