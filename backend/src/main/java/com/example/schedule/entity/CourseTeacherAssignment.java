package com.example.schedule.entity;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import com.example.schedule.model.SubShift;
import com.example.schedule.model.TeacherShift;
import com.example.schedule.model.ScheduleWeekday;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "course_teacher_assignments",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_course_teacher_shift",
                columnNames = {"teacher_id", "course_id", "shift", "sub_shift"}
        ),
        indexes = {
                @Index(name = "idx_course_teacher_assignments_teacher", columnList = "teacher_id"),
                @Index(name = "idx_course_teacher_assignments_course", columnList = "course_id"),
                @Index(name = "idx_course_teacher_assignments_weekday", columnList = "weekday")
        }
)
public class CourseTeacherAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TeacherShift shift;

    @Enumerated(EnumType.STRING)
    @Column(name = "sub_shift")
    private SubShift subShift;

    @Enumerated(EnumType.STRING)
    @Column(name = "weekday")
    private ScheduleWeekday weekday;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Teacher getTeacher() {
        return teacher;
    }

    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
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

    public Instant getCreatedAt() {
        return createdAt;
    }
}
