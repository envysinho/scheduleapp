package com.example.schedule.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schedule.entity.Teacher;
import com.example.schedule.model.EmploymentType;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    @Query("""
            SELECT DISTINCT t FROM Teacher t
            LEFT JOIN t.courseAssignments a
            WHERE (:employmentType IS NULL OR t.employmentType = :employmentType)
              AND (:cycle IS NULL OR a.course.cycle = :cycle)
            ORDER BY t.lastName ASC, t.firstName ASC
            """)
    List<Teacher> findByFilters(
            @Param("employmentType") EmploymentType employmentType,
            @Param("cycle") Integer cycle);

    Optional<Teacher> findByEmail(String email);
}
