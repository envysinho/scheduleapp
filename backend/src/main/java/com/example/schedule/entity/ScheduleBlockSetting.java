package com.example.schedule.entity;

import java.time.LocalTime;

import com.example.schedule.model.ScheduleBlockId;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "schedule_block_settings")
public class ScheduleBlockSetting {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "block_id", nullable = false)
    private ScheduleBlockId blockId;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

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
