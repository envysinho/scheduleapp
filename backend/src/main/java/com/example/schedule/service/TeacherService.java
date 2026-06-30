package com.example.schedule.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule.dto.CreateTeacherRequest;
import com.example.schedule.dto.TeacherAssignmentRequest;
import com.example.schedule.dto.TeacherResponse;
import com.example.schedule.dto.UpdateTeacherRequest;
import com.example.schedule.entity.Teacher;
import com.example.schedule.entity.TeacherAssignment;
import com.example.schedule.model.CourseCategory;
import com.example.schedule.model.EmploymentType;
import com.example.schedule.model.TeacherShift;
import com.example.schedule.repository.TeacherRepository;

@Service
public class TeacherService {

    private final TeacherRepository teacherRepository;

    public TeacherService(TeacherRepository teacherRepository) {
        this.teacherRepository = teacherRepository;
    }

    @Transactional(readOnly = true)
    public List<TeacherResponse> findAll(
            EmploymentType employmentType,
            TeacherShift shift,
            CourseCategory courseCategory,
            Integer cycle) {
        return teacherRepository.findByFilters(employmentType, shift, courseCategory, cycle).stream()
                .map(TeacherResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeacherResponse findById(Long id) {
        return TeacherResponse.from(getTeacherOrThrow(id));
    }

    @Transactional
    public TeacherResponse create(CreateTeacherRequest request) {
        Teacher teacher = new Teacher();
        applyTeacherFields(teacher, request.firstName(), request.lastName(),
                request.email(), request.phone(), request.employmentType(), request.shift());
        teacher.replaceAssignments(toAssignments(request.assignments()));
        return TeacherResponse.from(teacherRepository.save(teacher));
    }

    @Transactional
    public TeacherResponse update(Long id, UpdateTeacherRequest request) {
        Teacher teacher = getTeacherOrThrow(id);
        applyTeacherFields(teacher, request.firstName(), request.lastName(),
                request.email(), request.phone(), request.employmentType(), request.shift());
        teacher.replaceAssignments(toAssignments(request.assignments()));
        return TeacherResponse.from(teacherRepository.save(teacher));
    }

    @Transactional
    public void delete(Long id) {
        Teacher teacher = getTeacherOrThrow(id);
        teacherRepository.delete(teacher);
    }

    @Transactional
    public void seedDemoIfEmpty() {
        if (teacherRepository.count() > 0) {
            return;
        }

        CreateTeacherRequest teacher1 = new CreateTeacherRequest(
                "María",
                "García",
                "maria.garcia@unc.edu.pe",
                "987654321",
                EmploymentType.NOMBRADO,
                TeacherShift.MANANA,
                List.of(
                        new TeacherAssignmentRequest("Cálculo I", CourseCategory.CARRERA, 1),
                        new TeacherAssignmentRequest("Matemática General", CourseCategory.ESTUDIOS_GENERALES, 1)));

        CreateTeacherRequest teacher2 = new CreateTeacherRequest(
                "Carlos",
                "López",
                "carlos.lopez@unc.edu.pe",
                "912345678",
                EmploymentType.CONTRATADO,
                TeacherShift.TARDE,
                List.of(
                        new TeacherAssignmentRequest("Programación I", CourseCategory.CARRERA, 2),
                        new TeacherAssignmentRequest("Introducción a la Computación", CourseCategory.ESTUDIOS_GENERALES, 2)));

        CreateTeacherRequest teacher3 = new CreateTeacherRequest(
                "Ana",
                "Torres",
                "ana.torres@unc.edu.pe",
                null,
                EmploymentType.INVITADO,
                TeacherShift.MANANA,
                List.of(
                        new TeacherAssignmentRequest("Física I", CourseCategory.CARRERA, 3)));

        create(teacher1);
        create(teacher2);
        create(teacher3);
    }

    private void applyTeacherFields(
            Teacher teacher,
            String firstName,
            String lastName,
            String email,
            String phone,
            EmploymentType employmentType,
            TeacherShift shift) {
        teacher.setFirstName(firstName.trim());
        teacher.setLastName(lastName.trim());
        teacher.setEmail(blankToNull(email));
        teacher.setPhone(blankToNull(phone));
        teacher.setEmploymentType(employmentType);
        teacher.setShift(shift);
    }

    private List<TeacherAssignment> toAssignments(List<TeacherAssignmentRequest> requests) {
        return requests.stream()
                .map(this::toAssignment)
                .toList();
    }

    private TeacherAssignment toAssignment(TeacherAssignmentRequest request) {
        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setCourseName(request.courseName().trim());
        assignment.setCourseCategory(request.courseCategory());
        assignment.setCycle(request.cycle());
        return assignment;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private Teacher getTeacherOrThrow(Long id) {
        return teacherRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Docente no encontrado"));
    }
}
