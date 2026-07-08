package com.example.schedule.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.example.schedule.model.SubShift;
import com.example.schedule.model.TeacherShift;

@Entity
@Table(name = "space_assignments")
public class SpaceAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_name", nullable = false)
    private String courseName;

    @Column(nullable = false, length = 20)
    private String semester = "26-II";

    private Integer cycle;

    @Enumerated(EnumType.STRING)
    private TeacherShift shift;

    @Enumerated(EnumType.STRING)
    @Column(name = "sub_shift")
    private SubShift subShift;

    @ManyToOne(optional = false)
    @JoinColumn(name = "space_id", nullable = false)
    private Space space;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
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

    public Space getSpace() {
        return space;
    }

    public void setSpace(Space space) {
        this.space = space;
    }
}
