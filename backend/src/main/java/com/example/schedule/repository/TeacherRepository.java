package com.example.schedule.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schedule.entity.Teacher;
import com.example.schedule.model.CourseCategory;
import com.example.schedule.model.EmploymentType;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    @Query("""
            SELECT DISTINCT t FROM Teacher t
            LEFT JOIN t.assignments a
            WHERE (:employmentType IS NULL OR t.employmentType = :employmentType)
              AND (:courseCategory IS NULL OR a.courseCategory = :courseCategory)
              AND (:cycle IS NULL OR a.cycle = :cycle)
            ORDER BY t.lastName ASC, t.firstName ASC
            """)
    List<Teacher> findByFilters(
            @Param("employmentType") EmploymentType employmentType,
            @Param("courseCategory") CourseCategory courseCategory,
            @Param("cycle") Integer cycle);
}
