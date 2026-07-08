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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.schedule.dto.CreateSpaceRequest;
import com.example.schedule.dto.SpaceResponse;
import com.example.schedule.dto.UpdateSpaceRequest;
import com.example.schedule.model.Semester;
import com.example.schedule.model.SpaceAvailability;
import com.example.schedule.model.SpaceType;
import com.example.schedule.service.SpaceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/spaces")
public class SpaceController {

    private final SpaceService spaceService;

    public SpaceController(SpaceService spaceService) {
        this.spaceService = spaceService;
    }

    @GetMapping
    public List<SpaceResponse> listSpaces(
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) SpaceType spaceType,
            @RequestParam(required = false) SpaceAvailability availability,
            @RequestParam(required = false) Integer cycle) {
        return spaceService.findAll(Semester.normalize(semester), spaceType, availability, cycle);
    }

    @GetMapping("/{id}")
    public SpaceResponse getSpace(
            @PathVariable("id") Long id,
            @RequestParam(required = false) String semester) {
        return spaceService.findById(id, Semester.normalize(semester));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SpaceResponse createSpace(@Valid @RequestBody CreateSpaceRequest request) {
        return spaceService.create(request);
    }

    @PutMapping("/{id}")
    public SpaceResponse updateSpace(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateSpaceRequest request) {
        return spaceService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSpace(@PathVariable("id") Long id) {
        spaceService.delete(id);
    }
}
