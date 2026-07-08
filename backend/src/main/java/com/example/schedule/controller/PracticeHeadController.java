package com.example.schedule.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.schedule.dto.CreatePracticeHeadRequest;
import com.example.schedule.dto.PracticeHeadResponse;
import com.example.schedule.dto.UpdatePracticeHeadRequest;
import com.example.schedule.service.PracticeHeadService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/practice-heads")
public class PracticeHeadController {

    private final PracticeHeadService practiceHeadService;

    public PracticeHeadController(PracticeHeadService practiceHeadService) {
        this.practiceHeadService = practiceHeadService;
    }

    @GetMapping
    public List<PracticeHeadResponse> listPracticeHeads() {
        return practiceHeadService.findAll();
    }

    @GetMapping("/{id}")
    public PracticeHeadResponse getPracticeHead(@PathVariable("id") Long id) {
        return practiceHeadService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PracticeHeadResponse createPracticeHead(@Valid @RequestBody CreatePracticeHeadRequest request) {
        return practiceHeadService.create(request);
    }

    @PutMapping("/{id}")
    public PracticeHeadResponse updatePracticeHead(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdatePracticeHeadRequest request) {
        return practiceHeadService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePracticeHead(@PathVariable("id") Long id) {
        practiceHeadService.delete(id);
    }
}
