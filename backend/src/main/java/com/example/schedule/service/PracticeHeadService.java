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

import com.example.schedule.dto.CreatePracticeHeadRequest;
import com.example.schedule.dto.PracticeHeadLabAssignmentRequest;
import com.example.schedule.dto.PracticeHeadResponse;
import com.example.schedule.dto.UpdatePracticeHeadRequest;
import com.example.schedule.entity.PracticeHead;
import com.example.schedule.entity.PracticeHeadLabAssignment;
import com.example.schedule.entity.Space;
import com.example.schedule.model.Semester;
import com.example.schedule.model.SpaceType;
import com.example.schedule.repository.PracticeHeadRepository;
import com.example.schedule.repository.SpaceRepository;

@Service
public class PracticeHeadService {

    private final PracticeHeadRepository practiceHeadRepository;
    private final SpaceRepository spaceRepository;
    private final NotificationService notificationService;
    private final JdbcTemplate jdbcTemplate;

    public PracticeHeadService(
            PracticeHeadRepository practiceHeadRepository,
            SpaceRepository spaceRepository,
            NotificationService notificationService,
            JdbcTemplate jdbcTemplate) {
        this.practiceHeadRepository = practiceHeadRepository;
        this.spaceRepository = spaceRepository;
        this.notificationService = notificationService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<PracticeHeadResponse> findAll(String semester) {
        return practiceHeadRepository.findBySemesterOrderByLastNameAscFirstNameAsc(Semester.normalize(semester)).stream()
                .map(PracticeHeadResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PracticeHeadResponse findById(Long id) {
        return PracticeHeadResponse.from(getPracticeHeadOrThrow(id));
    }

    @Transactional
    public PracticeHeadResponse create(CreatePracticeHeadRequest request) {
        validateAssignments(request.labAssignments());
        PracticeHead practiceHead = new PracticeHead();
        applyPracticeHeadFields(practiceHead, request.firstName(), request.lastName(),
                request.semester(), request.email(), request.phone());
        practiceHead.replaceLabAssignments(toAssignments(request.labAssignments()));
        PracticeHead saved = practiceHeadRepository.save(practiceHead);
        notificationService.record("agregó al jefe de práctica " + practiceHeadName(saved));
        logAssignmentChanges(saved, Set.of(), assignmentLogs(saved));
        return PracticeHeadResponse.from(saved);
    }

    @Transactional
    public PracticeHeadResponse update(Long id, UpdatePracticeHeadRequest request) {
        validateAssignments(request.labAssignments());
        PracticeHead practiceHead = getPracticeHeadOrThrow(id);
        Set<AssignmentLog> previousAssignments = assignmentLogs(practiceHead);
        applyPracticeHeadFields(practiceHead, request.firstName(), request.lastName(),
                request.semester(), request.email(), request.phone());
        practiceHead.replaceLabAssignments(toAssignments(request.labAssignments()));
        PracticeHead saved = practiceHeadRepository.save(practiceHead);
        notificationService.record("actualizó al jefe de práctica " + practiceHeadName(saved));
        logAssignmentChanges(saved, previousAssignments, assignmentLogs(saved));
        return PracticeHeadResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        PracticeHead practiceHead = getPracticeHeadOrThrow(id);
        String deletedName = practiceHeadName(practiceHead);
        practiceHeadRepository.delete(practiceHead);
        notificationService.record("eliminó al jefe de práctica " + deletedName);
    }

    @Transactional
    public void migrateSemestersIfNeeded() {
        try {
            jdbcTemplate.execute("""
                    ALTER TABLE practice_heads
                    ADD COLUMN IF NOT EXISTS semester VARCHAR(20)
                    """);
            jdbcTemplate.execute("""
                    UPDATE practice_heads
                    SET semester = '26-II'
                    WHERE semester IS NULL OR semester = ''
                    """);
            jdbcTemplate.execute("""
                    ALTER TABLE practice_heads
                    ALTER COLUMN semester SET NOT NULL
                    """);
        } catch (Exception ignored) {
        }
    }

    private String practiceHeadName(PracticeHead practiceHead) {
        return (practiceHead.getFirstName() + " " + practiceHead.getLastName()).trim();
    }

    private Set<AssignmentLog> assignmentLogs(PracticeHead practiceHead) {
        return practiceHead.getLabAssignments().stream()
                .map(assignment -> new AssignmentLog(
                        assignment.getSpace().getId(),
                        assignment.getSpace().getName()))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private void logAssignmentChanges(
            PracticeHead practiceHead,
            Set<AssignmentLog> previous,
            Set<AssignmentLog> current) {
        for (AssignmentLog assignment : current) {
            if (!previous.contains(assignment)) {
                notificationService.record("asignó el laboratorio " + assignment.spaceName()
                        + " al jefe de práctica " + practiceHeadName(practiceHead));
            }
        }
        for (AssignmentLog assignment : previous) {
            if (!current.contains(assignment)) {
                notificationService.record("desasignó el laboratorio " + assignment.spaceName()
                        + " del jefe de práctica " + practiceHeadName(practiceHead));
            }
        }
    }

    private void validateAssignments(List<PracticeHeadLabAssignmentRequest> requests) {
        if (requests == null) {
            return;
        }

        Set<Long> spaceIds = new LinkedHashSet<>();
        for (PracticeHeadLabAssignmentRequest request : requests) {
            if (request == null || request.spaceId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Cada asignación debe tener un laboratorio");
            }
            if (!spaceIds.add(request.spaceId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Un jefe de práctica no puede tener el mismo laboratorio asignado más de una vez");
            }
            getLabOrThrow(request.spaceId());
        }
    }

    private List<PracticeHeadLabAssignment> toAssignments(List<PracticeHeadLabAssignmentRequest> requests) {
        if (requests == null) {
            return List.of();
        }
        return requests.stream()
                .map(this::toAssignment)
                .toList();
    }

    private PracticeHeadLabAssignment toAssignment(PracticeHeadLabAssignmentRequest request) {
        PracticeHeadLabAssignment assignment = new PracticeHeadLabAssignment();
        assignment.setSpace(getLabOrThrow(request.spaceId()));
        return assignment;
    }

    private void applyPracticeHeadFields(
            PracticeHead practiceHead,
            String firstName,
            String lastName,
            String semester,
            String email,
            String phone) {
        practiceHead.setFirstName(firstName.trim());
        practiceHead.setLastName(lastName.trim());
        practiceHead.setSemester(Semester.normalize(semester));
        practiceHead.setEmail(blankToNull(email));
        practiceHead.setPhone(blankToNull(phone));
    }

    private Space getLabOrThrow(Long spaceId) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Laboratorio no encontrado: " + spaceId));
        if (space.getSpaceType() != SpaceType.LABORATORIO) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El ambiente asignado no es un laboratorio: " + space.getName());
        }
        return space;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private PracticeHead getPracticeHeadOrThrow(Long id) {
        return practiceHeadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Jefe de práctica no encontrado"));
    }

    private record AssignmentLog(Long spaceId, String spaceName) {
    }
}
