package com.example.schedule.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schedule.entity.Course;
import com.example.schedule.model.CourseType;

public interface CourseRepository extends JpaRepository<Course, Long> {

    @Query("""
            SELECT DISTINCT c FROM Course c
            LEFT JOIN FETCH c.morningTeacher
            LEFT JOIN FETCH c.afternoonTeacher
            LEFT JOIN FETCH c.nightTeacher
            LEFT JOIN FETCH c.spaceAssignments sa
            LEFT JOIN FETCH sa.space
            WHERE c.semester = :semester
              AND (:type IS NULL OR c.type = :type)
              AND (:cycle IS NULL OR c.cycle = :cycle)
            ORDER BY c.cycle ASC, c.name ASC
            """)
    List<Course> findByFilters(
            @Param("semester") String semester,
            @Param("type") CourseType type,
            @Param("cycle") Integer cycle);

    @Query("""
            SELECT c FROM Course c
            WHERE c.morningTeacher.id = :teacherId
               OR c.afternoonTeacher.id = :teacherId
               OR c.nightTeacher.id = :teacherId
            """)
    List<Course> findByTeacherId(@Param("teacherId") Long teacherId);

    Optional<Course> findByCode(String code);

    Optional<Course> findByName(String name);

    Optional<Course> findByNameAndSemester(String name, String semester);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    boolean existsByCodeAndSemester(String code, String semester);

    boolean existsByCodeAndSemesterAndIdNot(String code, String semester, Long id);
}
