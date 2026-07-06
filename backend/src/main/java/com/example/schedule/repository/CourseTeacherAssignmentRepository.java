package com.example.schedule.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schedule.entity.CourseTeacherAssignment;
import com.example.schedule.model.TeacherShift;

public interface CourseTeacherAssignmentRepository
        extends JpaRepository<CourseTeacherAssignment, Long> {

    List<CourseTeacherAssignment> findByTeacherId(Long teacherId);

    long countByTeacherIdAndShift(Long teacherId, TeacherShift shift);

    List<CourseTeacherAssignment> findByCourseId(Long courseId);
}
