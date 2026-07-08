package com.example.schedule.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schedule.entity.PracticeHead;

public interface PracticeHeadRepository extends JpaRepository<PracticeHead, Long> {

    List<PracticeHead> findAllByOrderByLastNameAscFirstNameAsc();
}
