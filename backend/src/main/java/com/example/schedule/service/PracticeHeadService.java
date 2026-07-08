package com.example.schedule.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
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
import com.example.schedule.model.SpaceType;
import com.example.schedule.repository.PracticeHeadRepository;
import com.example.schedule.repository.SpaceRepository;

@Service
public class PracticeHeadService {

    private final PracticeHeadRepository practiceHeadRepository;
    private final SpaceRepository spaceRepository;

    public PracticeHeadService(
            PracticeHeadRepository practiceHeadRepository,
            SpaceRepository spaceRepository) {
        this.practiceHeadRepository = practiceHeadRepository;
        this.spaceRepository = spaceRepository;
    }

    @Transactional(readOnly = true)
    public List<PracticeHeadResponse> findAll() {
        return practiceHeadRepository.findAllByOrderByLastNameAscFirstNameAsc().stream()
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
                request.email(), request.phone());
        practiceHead.replaceLabAssignments(toAssignments(request.labAssignments()));
        return PracticeHeadResponse.from(practiceHeadRepository.save(practiceHead));
    }

    @Transactional
    public PracticeHeadResponse update(Long id, UpdatePracticeHeadRequest request) {
        validateAssignments(request.labAssignments());
        PracticeHead practiceHead = getPracticeHeadOrThrow(id);
        applyPracticeHeadFields(practiceHead, request.firstName(), request.lastName(),
                request.email(), request.phone());
        practiceHead.replaceLabAssignments(toAssignments(request.labAssignments()));
        return PracticeHeadResponse.from(practiceHeadRepository.save(practiceHead));
    }

    @Transactional
    public void delete(Long id) {
        PracticeHead practiceHead = getPracticeHeadOrThrow(id);
        practiceHeadRepository.delete(practiceHead);
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
            String email,
            String phone) {
        practiceHead.setFirstName(firstName.trim());
        practiceHead.setLastName(lastName.trim());
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
}
