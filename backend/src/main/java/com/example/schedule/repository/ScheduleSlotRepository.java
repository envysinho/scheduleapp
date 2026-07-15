package com.example.schedule.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schedule.entity.ScheduleSlot;

public interface ScheduleSlotRepository extends JpaRepository<ScheduleSlot, Long> {

    @Query("""
            SELECT s FROM ScheduleSlot s
            LEFT JOIN FETCH s.course
            LEFT JOIN FETCH s.teacher
            LEFT JOIN FETCH s.space
            WHERE s.semester = :semester
              AND s.cycle = :cycle
            ORDER BY s.weekday ASC, s.startTime ASC, s.endTime ASC, s.course.name ASC
            """)
    List<ScheduleSlot> findBySemesterAndCycle(
            @Param("semester") String semester,
            @Param("cycle") Integer cycle);

    @Query("""
            SELECT s FROM ScheduleSlot s
            LEFT JOIN FETCH s.course
            LEFT JOIN FETCH s.teacher
            LEFT JOIN FETCH s.space
            WHERE s.semester = :semester
            ORDER BY s.cycle ASC, s.weekday ASC, s.startTime ASC
            """)
    List<ScheduleSlot> findBySemester(@Param("semester") String semester);

    @Query("""
            SELECT DISTINCT s.cycle FROM ScheduleSlot s
            WHERE s.semester = :semester
            ORDER BY s.cycle ASC
            """)
    List<Integer> findDistinctCyclesBySemester(@Param("semester") String semester);

    void deleteBySemesterAndCycle(String semester, Integer cycle);
}
