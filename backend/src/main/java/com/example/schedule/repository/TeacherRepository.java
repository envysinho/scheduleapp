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
            SELECT t FROM Teacher t
            WHERE t.semester = :semester
              AND (:employmentType IS NULL OR t.employmentType = :employmentType)
              AND (:cycle IS NULL OR EXISTS (
                  SELECT 1 FROM t.courseAssignments a WHERE a.course.cycle = :cycle
              ))
            ORDER BY t.lastName ASC, t.firstName ASC
            """)
    List<Teacher> findByFilters(
            @Param("semester") String semester,
            @Param("employmentType") EmploymentType employmentType,
            @Param("cycle") Integer cycle);

    Optional<Teacher> findByEmail(String email);
}
