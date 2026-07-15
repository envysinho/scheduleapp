package com.example.schedule.entity;

import java.time.Instant;
import java.time.LocalTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.example.schedule.model.ScheduleWeekday;
import com.example.schedule.model.SubShift;
import com.example.schedule.model.TeacherShift;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "schedule_slots")
public class ScheduleSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String semester;

    @Column(nullable = false)
    private Integer cycle;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id")
    private Space space;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TeacherShift shift;

    @Enumerated(EnumType.STRING)
    @Column(name = "sub_shift")
    private SubShift subShift;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScheduleWeekday weekday;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "settings_fingerprint", nullable = false, length = 500)
    private String settingsFingerprint;

    @Transient
    private Long assignmentId;

    @Transient
    private boolean automaticWeekday;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public Integer getCycle() {
        return cycle;
    }

    public void setCycle(Integer cycle) {
        this.cycle = cycle;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public Teacher getTeacher() {
        return teacher;
    }

    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    public Space getSpace() {
        return space;
    }

    public void setSpace(Space space) {
        this.space = space;
    }

    public TeacherShift getShift() {
        return shift;
    }

    public void setShift(TeacherShift shift) {
        this.shift = shift;
    }

    public SubShift getSubShift() {
        return subShift;
    }

    public void setSubShift(SubShift subShift) {
        this.subShift = subShift;
    }

    public ScheduleWeekday getWeekday() {
        return weekday;
    }

    public void setWeekday(ScheduleWeekday weekday) {
        this.weekday = weekday;
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

    public Long getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(Long assignmentId) {
        this.assignmentId = assignmentId;
    }

    public boolean isAutomaticWeekday() {
        return automaticWeekday;
    }

    public void setAutomaticWeekday(boolean automaticWeekday) {
        this.automaticWeekday = automaticWeekday;
    }

    public String getSettingsFingerprint() {
        return settingsFingerprint;
    }

    public void setSettingsFingerprint(String settingsFingerprint) {
        this.settingsFingerprint = settingsFingerprint;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
