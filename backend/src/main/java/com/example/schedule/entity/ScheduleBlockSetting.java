package com.example.schedule.entity;

import java.time.LocalTime;

import com.example.schedule.model.ScheduleBlockId;
import com.example.schedule.model.ScheduleBlockSettingId;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

@Entity
@Table(name = "schedule_block_settings")
@IdClass(ScheduleBlockSettingId.class)
public class ScheduleBlockSetting {

    @Id
    @Column(nullable = false, length = 20)
    private String semester;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "block_id", nullable = false)
    private ScheduleBlockId blockId;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public ScheduleBlockId getBlockId() {
        return blockId;
    }

    public void setBlockId(ScheduleBlockId blockId) {
        this.blockId = blockId;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }
}
