package com.example.schedule.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
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
import com.example.schedule.model.Semester;
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
    private final JdbcTemplate jdbcTemplate;

    public SpaceService(
            SpaceRepository spaceRepository,
            CourseRepository courseRepository,
            NotificationService notificationService,
            JdbcTemplate jdbcTemplate) {
        this.spaceRepository = spaceRepository;
        this.courseRepository = courseRepository;
        this.notificationService = notificationService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<SpaceResponse> findAll(
            String semester,
            SpaceType spaceType,
            SpaceAvailability availability,
            Integer cycle) {
        String normalizedSemester = Semester.normalize(semester);
        return spaceRepository.findByFilters(normalizedSemester, spaceType, availability, cycle).stream()
                .map(space -> SpaceResponse.from(space, normalizedSemester))
                .toList();
    }

    @Transactional(readOnly = true)
    public SpaceResponse findById(Long id, String semester) {
        return SpaceResponse.from(getSpaceOrThrow(id), Semester.normalize(semester));
    }

    @Transactional
    public SpaceResponse create(CreateSpaceRequest request) {
        validateAssignments(request.assignments(), request.semester());
        Space space = new Space();
        applySpaceFields(space, request.name(), request.spaceType(), request.availability(),
                request.managerName(), request.managerPhone());
        replaceAssignmentsForSemester(space, toAssignments(request.assignments(), request.semester()), request.semester());
        Space saved = spaceRepository.save(space);
        notificationService.record("agregó el ambiente " + saved.getName());
        logAssignmentChanges(saved, Set.of(), assignmentLogs(saved, request.semester()));
        return SpaceResponse.from(saved, Semester.normalize(request.semester()));
    }

    @Transactional
    public SpaceResponse update(Long id, UpdateSpaceRequest request) {
        validateAssignments(request.assignments(), request.semester());
        Space space = getSpaceOrThrow(id);
        Set<AssignmentLog> previousAssignments = assignmentLogs(space, request.semester());
        applySpaceFields(space, request.name(), request.spaceType(), request.availability(),
                request.managerName(), request.managerPhone());
        replaceAssignmentsForSemester(space, toAssignments(request.assignments(), request.semester()), request.semester());
        Space saved = spaceRepository.save(space);
        notificationService.record("actualizó el ambiente " + saved.getName());
        logAssignmentChanges(saved, previousAssignments, assignmentLogs(saved, request.semester()));
        return SpaceResponse.from(saved, Semester.normalize(request.semester()));
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
                    Semester.CURRENT,
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
                    Semester.CURRENT,
                    labEncargados[i - 1],
                    labPhones[i - 1],
                    List.of(
                            new SpaceAssignmentRequest("Programación I", ((i - 1) % 10) + 1, null, null),
                            new SpaceAssignmentRequest("Química Orgánica", ((i + 1) % 10) + 1, null, null))));
        }
    }

    @Transactional
    public void migrateAssignmentSemestersIfNeeded() {
        try {
            jdbcTemplate.execute("""
                    ALTER TABLE space_assignments
                    ADD COLUMN IF NOT EXISTS semester VARCHAR(20)
                    """);
            jdbcTemplate.execute("""
                    UPDATE space_assignments
                    SET semester = '26-II'
                    WHERE semester IS NULL OR semester = ''
                    """);
            jdbcTemplate.execute("""
                    ALTER TABLE space_assignments
                    ALTER COLUMN semester SET NOT NULL
                    """);
        } catch (Exception ignored) {
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

    private List<SpaceAssignment> toAssignments(List<SpaceAssignmentRequest> requests, String semester) {
        String normalizedSemester = Semester.normalize(semester);
        return requests.stream()
                .map(request -> toAssignment(request, normalizedSemester))
                .toList();
    }

    private SpaceAssignment toAssignment(SpaceAssignmentRequest request, String semester) {
        SpaceAssignment assignment = new SpaceAssignment();
        assignment.setCourseName(request.courseName().trim());
        assignment.setSemester(semester);
        assignment.setCycle(request.cycle());
        assignment.setShift(request.shift());
        assignment.setSubShift(resolveSubShift(request));
        return assignment;
    }

    private SubShift resolveSubShift(SpaceAssignmentRequest request) {
        return request.subShift();
    }

    private void replaceAssignmentsForSemester(Space space, List<SpaceAssignment> newAssignments, String semester) {
        String normalizedSemester = Semester.normalize(semester);
        space.getAssignments().removeIf(assignment -> normalizedSemester.equals(assignment.getSemester()));
        for (SpaceAssignment assignment : newAssignments) {
            assignment.setSpace(space);
            space.getAssignments().add(assignment);
        }
    }

    private Set<AssignmentLog> assignmentLogs(Space space, String semester) {
        String normalizedSemester = Semester.normalize(semester);
        return space.getAssignments().stream()
                .filter(assignment -> normalizedSemester.equals(assignment.getSemester()))
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

    private void validateAssignments(List<SpaceAssignmentRequest> requests, String semester) {
        String normalizedSemester = Semester.normalize(semester);
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
            validateSubShift(request, normalizedSemester);
        }
    }

    private void validateSubShift(SpaceAssignmentRequest request, String semester) {
        if (request.cycle() == null || request.shift() == null) {
            return;
        }
        var course = courseRepository.findByNameAndSemester(request.courseName().trim(), semester).orElse(null);
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
