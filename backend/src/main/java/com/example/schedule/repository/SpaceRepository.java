package com.example.schedule.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schedule.entity.Space;
import com.example.schedule.model.SpaceAvailability;
import com.example.schedule.model.SpaceType;

public interface SpaceRepository extends JpaRepository<Space, Long> {

    @Query("""
            SELECT DISTINCT s FROM Space s
            LEFT JOIN s.assignments a
            WHERE (:spaceType IS NULL OR s.spaceType = :spaceType)
              AND (:availability IS NULL OR s.availability = :availability)
              AND (:cycle IS NULL OR a.cycle = :cycle)
            ORDER BY s.name ASC
            """)
    List<Space> findByFilters(
            @Param("spaceType") SpaceType spaceType,
            @Param("availability") SpaceAvailability availability,
            @Param("cycle") Integer cycle);
}
