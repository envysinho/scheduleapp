package com.example.schedule.model;

import java.io.Serializable;
import java.util.Objects;

public class ScheduleBlockSettingId implements Serializable {

    private String semester;
    private String blockId;

    public ScheduleBlockSettingId() {
    }

    public ScheduleBlockSettingId(String semester, String blockId) {
        this.semester = semester;
        this.blockId = blockId;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getBlockId() {
        return blockId;
    }

    public void setBlockId(String blockId) {
        this.blockId = blockId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ScheduleBlockSettingId that)) {
            return false;
        }
        return Objects.equals(semester, that.semester) && Objects.equals(blockId, that.blockId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(semester, blockId);
    }
}
