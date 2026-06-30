package com.example.schedule.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule.dto.CreateSpaceRequest;
import com.example.schedule.dto.SpaceAssignmentRequest;
import com.example.schedule.dto.SpaceResponse;
import com.example.schedule.dto.UpdateSpaceRequest;
import com.example.schedule.entity.Space;
import com.example.schedule.entity.SpaceAssignment;
import com.example.schedule.model.SpaceAvailability;
import com.example.schedule.model.SpaceType;
import com.example.schedule.repository.SpaceRepository;

@Service
public class SpaceService {

    private final SpaceRepository spaceRepository;

    public SpaceService(SpaceRepository spaceRepository) {
        this.spaceRepository = spaceRepository;
    }

    @Transactional(readOnly = true)
    public List<SpaceResponse> findAll(
            SpaceType spaceType,
            SpaceAvailability availability,
            Integer cycle) {
        return spaceRepository.findByFilters(spaceType, availability, cycle).stream()
                .map(SpaceResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SpaceResponse findById(Long id) {
        return SpaceResponse.from(getSpaceOrThrow(id));
    }

    @Transactional
    public SpaceResponse create(CreateSpaceRequest request) {
        Space space = new Space();
        applySpaceFields(space, request.name(), request.spaceType(), request.availability(),
                request.managerName(), request.managerPhone());
        space.replaceAssignments(toAssignments(request.assignments()));
        return SpaceResponse.from(spaceRepository.save(space));
    }

    @Transactional
    public SpaceResponse update(Long id, UpdateSpaceRequest request) {
        Space space = getSpaceOrThrow(id);
        applySpaceFields(space, request.name(), request.spaceType(), request.availability(),
                request.managerName(), request.managerPhone());
        space.replaceAssignments(toAssignments(request.assignments()));
        return SpaceResponse.from(spaceRepository.save(space));
    }

    @Transactional
    public void delete(Long id) {
        Space space = getSpaceOrThrow(id);
        spaceRepository.delete(space);
    }

    @Transactional
    public void seedDemoIfEmpty() {
        if (spaceRepository.count() > 0) {
            return;
        }

        SpaceAvailability[] aulaAvailabilities = {
                SpaceAvailability.DISPONIBLE,
                SpaceAvailability.OCUPADO,
                SpaceAvailability.EN_MANTENIMIENTO,
                SpaceAvailability.DISPONIBLE,
                SpaceAvailability.OCUPADO,
        };

        String[] encargados = {
                "Roberto Mendoza",
                "Patricia Ruiz",
                "Luis Vargas",
                "Sandra Díaz",
                "Carlos Herrera",
        };

        String[] phones = {
                "987111222",
                "912333444",
                "945666777",
                "934555888",
                "976444555",
        };

        for (int i = 1; i <= 5; i++) {
            create(new CreateSpaceRequest(
                    "Aula " + i,
                    SpaceType.AULA,
                    aulaAvailabilities[i - 1],
                    encargados[i - 1],
                    phones[i - 1],
                    List.of(
                            new SpaceAssignmentRequest("Cálculo I", i),
                            new SpaceAssignmentRequest("Matemática General", i))));
        }

        SpaceAvailability[] labAvailabilities = {
                SpaceAvailability.DISPONIBLE,
                SpaceAvailability.OCUPADO,
                SpaceAvailability.DISPONIBLE,
                SpaceAvailability.EN_MANTENIMIENTO,
                SpaceAvailability.OCUPADO,
                SpaceAvailability.DISPONIBLE,
                SpaceAvailability.EN_MANTENIMIENTO,
                SpaceAvailability.OCUPADO,
        };

        String[] labEncargados = {
                "Ana Torres",
                "Miguel Castro",
                "Elena Ríos",
                "Jorge Paredes",
                "Lucía Morales",
                "Diego Salazar",
                "Rosa Fuentes",
                "Pedro Navarro",
        };

        String[] labPhones = {
                "981222333",
                "923444555",
                "956777888",
                "967888999",
                "978999000",
                "989000111",
                "990111222",
                "991222333",
        };

        for (int i = 1; i <= 8; i++) {
            create(new CreateSpaceRequest(
                    "Lab " + i,
                    SpaceType.LABORATORIO,
                    labAvailabilities[i - 1],
                    labEncargados[i - 1],
                    labPhones[i - 1],
                    List.of(
                            new SpaceAssignmentRequest("Programación I", ((i - 1) % 10) + 1),
                            new SpaceAssignmentRequest("Química Orgánica", ((i + 1) % 10) + 1))));
        }
    }

    private void applySpaceFields(
            Space space,
            String name,
            SpaceType spaceType,
            SpaceAvailability availability,
            String managerName,
            String managerPhone) {
        space.setName(name.trim());
        space.setSpaceType(spaceType);
        space.setAvailability(availability);
        space.setManagerName(managerName.trim());
        space.setManagerPhone(blankToNull(managerPhone));
    }

    private List<SpaceAssignment> toAssignments(List<SpaceAssignmentRequest> requests) {
        return requests.stream()
                .map(this::toAssignment)
                .toList();
    }

    private SpaceAssignment toAssignment(SpaceAssignmentRequest request) {
        SpaceAssignment assignment = new SpaceAssignment();
        assignment.setCourseName(request.courseName().trim());
        assignment.setCycle(request.cycle());
        return assignment;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private Space getSpaceOrThrow(Long id) {
        return spaceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Espacio no encontrado"));
    }
}
