package com.example.schedule.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
import com.example.schedule.model.CourseCycleRules;
import com.example.schedule.model.SpaceAvailability;
import com.example.schedule.model.SpaceType;
import com.example.schedule.model.SubShift;
import com.example.schedule.model.TeacherShift;
import com.example.schedule.repository.CourseRepository;
import com.example.schedule.repository.SpaceRepository;

@Service
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final CourseRepository courseRepository;
    private final NotificationService notificationService;

    public SpaceService(
            SpaceRepository spaceRepository,
            CourseRepository courseRepository,
            NotificationService notificationService) {
        this.spaceRepository = spaceRepository;
        this.courseRepository = courseRepository;
        this.notificationService = notificationService;
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
        validateAssignments(request.assignments());
        Space space = new Space();
        applySpaceFields(space, request.name(), request.spaceType(), request.availability(),
                request.managerName(), request.managerPhone());
        space.replaceAssignments(toAssignments(request.assignments()));
        Space saved = spaceRepository.save(space);
        notificationService.record("agregó el ambiente " + saved.getName());
        logAssignmentChanges(saved, Set.of(), assignmentLogs(saved));
        return SpaceResponse.from(saved);
    }

    @Transactional
    public SpaceResponse update(Long id, UpdateSpaceRequest request) {
        validateAssignments(request.assignments());
        Space space = getSpaceOrThrow(id);
        Set<AssignmentLog> previousAssignments = assignmentLogs(space);
        applySpaceFields(space, request.name(), request.spaceType(), request.availability(),
                request.managerName(), request.managerPhone());
        space.replaceAssignments(toAssignments(request.assignments()));
        Space saved = spaceRepository.save(space);
        notificationService.record("actualizó el ambiente " + saved.getName());
        logAssignmentChanges(saved, previousAssignments, assignmentLogs(saved));
        return SpaceResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Space space = getSpaceOrThrow(id);
        String deletedName = space.getName();
        spaceRepository.delete(space);
        notificationService.record("eliminó el ambiente " + deletedName);
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
                            new SpaceAssignmentRequest("Cálculo I", i, null, null),
                            new SpaceAssignmentRequest("Matemática General", i, null, null))));
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
                            new SpaceAssignmentRequest("Programación I", ((i - 1) % 10) + 1, null, null),
                            new SpaceAssignmentRequest("Química Orgánica", ((i + 1) % 10) + 1, null, null))));
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
        space.setManagerName(blankToEmpty(managerName));
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
        assignment.setShift(request.shift());
        assignment.setSubShift(resolveSubShift(request));
        return assignment;
    }

    private SubShift resolveSubShift(SpaceAssignmentRequest request) {
        return request.subShift();
    }

    private Set<AssignmentLog> assignmentLogs(Space space) {
        return space.getAssignments().stream()
                .map(assignment -> new AssignmentLog(
                        assignment.getCourseName(),
                        assignment.getCycle(),
                        assignment.getShift(),
                        assignment.getSubShift() == null ? null : assignment.getSubShift().name()))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private void logAssignmentChanges(
            Space space,
            Set<AssignmentLog> previous,
            Set<AssignmentLog> current) {
        for (AssignmentLog assignment : current) {
            if (!previous.contains(assignment)) {
                notificationService.record("asignó el curso " + assignment.courseName()
                        + " al ambiente " + space.getName() + assignmentSuffix(assignment));
            }
        }
        for (AssignmentLog assignment : previous) {
            if (!current.contains(assignment)) {
                notificationService.record("desasignó el curso " + assignment.courseName()
                        + " del ambiente " + space.getName() + assignmentSuffix(assignment));
            }
        }
    }

    private String assignmentSuffix(AssignmentLog assignment) {
        if (assignment.shift() == null) {
            return "";
        }
        String shift = assignment.subShift() == null
                ? assignment.shift().name()
                : assignment.shift().name() + " " + assignment.subShift();
        return " (" + shift + ")";
    }

    private void validateAssignments(List<SpaceAssignmentRequest> requests) {
        for (SpaceAssignmentRequest request : requests) {
            Integer cycle = request.cycle();
            TeacherShift shift = request.shift();
            if (cycle == null || shift == null) {
                continue;
            }
            if (CourseCycleRules.isNightOnlyCycle(cycle) && shift != TeacherShift.NOCHE) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El curso asignado es de ciclo nocturno (IX–X), solo turno NOCHE");
            }
            if (CourseCycleRules.isDayOnlyCycle(cycle) && shift == TeacherShift.NOCHE) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El curso asignado es de ciclo diurno (I–VIII), solo turnos MAÑANA o TARDE");
            }
            validateSubShift(request);
        }
    }

    private void validateSubShift(SpaceAssignmentRequest request) {
        if (request.cycle() == null || request.shift() == null) {
            return;
        }
        var course = courseRepository.findByName(request.courseName().trim()).orElse(null);
        var requiredSpaceType = course != null ? course.getRequiredSpaceType() : null;
        List<SubShift> allowed = CourseCycleRules.allowedSubShiftsForCycle(
                request.cycle(), request.shift(), requiredSpaceType);
        if (allowed.isEmpty()) {
            if (request.subShift() != null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El curso \"" + request.courseName()
                                + "\" no admite sub-turno para el turno seleccionado");
            }
            return;
        }
        if (request.subShift() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El curso \"" + request.courseName()
                            + "\" requiere un sub-turno (" + allowed + ")");
        }
        if (!allowed.contains(request.subShift())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sub-turno inválido para \"" + request.courseName()
                            + "\": " + request.subShift() + ". Válidos: " + allowed);
        }
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String blankToEmpty(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.trim();
    }

    private Space getSpaceOrThrow(Long id) {
        return spaceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Espacio no encontrado"));
    }

    private record AssignmentLog(String courseName, Integer cycle, TeacherShift shift, String subShift) {
    }
}
