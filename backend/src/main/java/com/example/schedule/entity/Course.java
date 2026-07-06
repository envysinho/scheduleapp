package com.example.schedule.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.example.schedule.model.CourseCycleRules;
import com.example.schedule.model.CourseType;
import com.example.schedule.model.TeacherShift;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseType type;

    @Column(nullable = false)
    private boolean lectivo = false;

    @Column(nullable = false)
    private Integer cycle;

    @ManyToOne
    @JoinColumn(name = "morning_teacher_id")
    private Teacher morningTeacher;

    @ManyToOne
    @JoinColumn(name = "afternoon_teacher_id")
    private Teacher afternoonTeacher;

    @ManyToOne
    @JoinColumn(name = "night_teacher_id")
    private Teacher nightTeacher;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CourseSpaceAssignment> spaceAssignments = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CourseTeacherAssignment> teacherAssignments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public CourseType getType() {
        return type;
    }

    public void setType(CourseType type) {
        this.type = type;
    }

    public boolean isLectivo() {
        return lectivo;
    }

    public void setLectivo(boolean lectivo) {
        this.lectivo = lectivo;
    }

    public Integer getCycle() {
        return cycle;
    }

    public void setCycle(Integer cycle) {
        this.cycle = cycle;
    }

    public Teacher getMorningTeacher() {
        return morningTeacher;
    }

    public void setMorningTeacher(Teacher morningTeacher) {
        this.morningTeacher = morningTeacher;
    }

    public Teacher getAfternoonTeacher() {
        return afternoonTeacher;
    }

    public void setAfternoonTeacher(Teacher afternoonTeacher) {
        this.afternoonTeacher = afternoonTeacher;
    }

    public Teacher getNightTeacher() {
        return nightTeacher;
    }

    public void setNightTeacher(Teacher nightTeacher) {
        this.nightTeacher = nightTeacher;
    }

    public List<CourseSpaceAssignment> getSpaceAssignments() {
        return spaceAssignments;
    }

    public void setSpaceAssignments(List<CourseSpaceAssignment> spaceAssignments) {
        this.spaceAssignments = spaceAssignments;
    }

    public List<CourseTeacherAssignment> getTeacherAssignments() {
        return teacherAssignments;
    }

    public void setTeacherAssignments(List<CourseTeacherAssignment> teacherAssignments) {
        this.teacherAssignments = teacherAssignments;
    }

    public void deriveShiftTeachers() {
        if (CourseCycleRules.isNightOnlyCycle(cycle)) {
            this.morningTeacher = null;
            this.afternoonTeacher = null;
            this.nightTeacher = teacherAssignments.stream()
                    .filter(a -> a.getShift() == TeacherShift.NOCHE)
                    .map(CourseTeacherAssignment::getTeacher)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);
            return;
        }
        this.morningTeacher = teacherAssignments.stream()
                .filter(a -> a.getShift() == TeacherShift.MANANA)
                .map(CourseTeacherAssignment::getTeacher)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
        this.afternoonTeacher = teacherAssignments.stream()
                .filter(a -> a.getShift() == TeacherShift.TARDE)
                .map(CourseTeacherAssignment::getTeacher)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
        this.nightTeacher = teacherAssignments.stream()
                .filter(a -> a.getShift() == TeacherShift.NOCHE)
                .map(CourseTeacherAssignment::getTeacher)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void replaceSpaceAssignments(List<CourseSpaceAssignment> newAssignments) {
        spaceAssignments.clear();
        for (CourseSpaceAssignment assignment : newAssignments) {
            assignment.setCourse(this);
            spaceAssignments.add(assignment);
        }
    }
}
