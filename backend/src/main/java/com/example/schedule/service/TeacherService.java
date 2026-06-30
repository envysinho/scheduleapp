package com.example.schedule.service;

import java.util.LinkedHashSet;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbcTemplate;

    public TeacherService(TeacherRepository teacherRepository, JdbcTemplate jdbcTemplate) {
        this.teacherRepository = teacherRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<TeacherResponse> findAll(
            EmploymentType employmentType,
            TeacherShift shift,
            Integer cycle) {
        return teacherRepository.findByFilters(employmentType, cycle).stream()
                .filter(teacher -> matchesShift(teacher, shift))
                .map(TeacherResponse::from)
                .toList();
    }

    private boolean matchesShift(Teacher teacher, TeacherShift shift) {
        if (shift == null) {
            return true;
        }
        return teacher.getShifts().contains(shift);
    }

    @Transactional(readOnly = true)
    public TeacherResponse findById(Long id) {
        return TeacherResponse.from(getTeacherOrThrow(id));
    }

    @Transactional
    public TeacherResponse create(CreateTeacherRequest request) {
        validateAssignments(request.employmentType(), request.assignments());
        Teacher teacher = new Teacher();
        applyTeacherFields(teacher, request.firstName(), request.lastName(),
                request.email(), request.phone(), request.employmentType(), request.shifts());
        teacher.replaceAssignments(toAssignments(request.assignments()));
        return TeacherResponse.from(teacherRepository.save(teacher));
    }

    @Transactional
    public TeacherResponse update(Long id, UpdateTeacherRequest request) {
        validateAssignments(request.employmentType(), request.assignments());
        Teacher teacher = getTeacherOrThrow(id);
        applyTeacherFields(teacher, request.firstName(), request.lastName(),
                request.email(), request.phone(), request.employmentType(), request.shifts());
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
                List.of(TeacherShift.MANANA),
                List.of(
                        new TeacherAssignmentRequest("Cálculo I", CourseCategory.CARRERA, 1),
                        new TeacherAssignmentRequest("Álgebra Lineal", CourseCategory.CARRERA, 2)));

        CreateTeacherRequest teacher2 = new CreateTeacherRequest(
                "Carlos",
                "López",
                "carlos.lopez@unc.edu.pe",
                "912345678",
                EmploymentType.CONTRATADO,
                List.of(TeacherShift.TARDE),
                List.of(
                        new TeacherAssignmentRequest("Programación I", CourseCategory.CARRERA, 2),
                        new TeacherAssignmentRequest("Estructuras de Datos", CourseCategory.CARRERA, 3)));

        CreateTeacherRequest teacher3 = new CreateTeacherRequest(
                "Ana",
                "Torres",
                "ana.torres@unc.edu.pe",
                null,
                EmploymentType.ESTUDIOS_GENERALES,
                List.of(TeacherShift.MANANA),
                List.of(
                        new TeacherAssignmentRequest("Matemática General", CourseCategory.ESTUDIOS_GENERALES, 1),
                        new TeacherAssignmentRequest("Comunicación", CourseCategory.ESTUDIOS_GENERALES, 1)));

        create(teacher1);
        create(teacher2);
        create(teacher3);
    }

    @Transactional
    public void migrateEmploymentTypesIfNeeded() {
        try {
            jdbcTemplate.execute("""
                    ALTER TABLE teachers
                    DROP CONSTRAINT IF EXISTS teachers_employment_type_check
                    """);
            jdbcTemplate.execute("""
                    UPDATE teachers
                    SET employment_type = 'ESTUDIOS_GENERALES'
                    WHERE employment_type = 'INVITADO'
                    """);
            jdbcTemplate.execute("""
                    ALTER TABLE teachers
                    ADD CONSTRAINT teachers_employment_type_check
                    CHECK (employment_type IN ('NOMBRADO', 'CONTRATADO', 'ESTUDIOS_GENERALES'))
                    """);
        } catch (Exception ignored) {
            // Table may not exist yet on first bootstrap.
        }
    }

    @Transactional
    public void migrateLegacyShiftsIfNeeded() {
        try {
            jdbcTemplate.execute("""
                    INSERT INTO teacher_shifts (teacher_id, shift)
                    SELECT t.id, t.shift
                    FROM teachers t
                    WHERE t.shift IS NOT NULL
                      AND NOT EXISTS (
                        SELECT 1 FROM teacher_shifts ts WHERE ts.teacher_id = t.id
                      )
                    """);
        } catch (Exception ignored) {
            // Legacy column may not exist on fresh databases.
        }
    }

    private void validateAssignments(EmploymentType employmentType, List<TeacherAssignmentRequest> assignments) {
        CourseCategory expectedCategory = expectedCourseCategory(employmentType);
        boolean hasMismatch = assignments.stream()
                .anyMatch(assignment -> assignment.courseCategory() != expectedCategory);
        if (hasMismatch) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Las asignaciones no coinciden con el tipo de docente seleccionado");
        }
    }

    private CourseCategory expectedCourseCategory(EmploymentType employmentType) {
        if (employmentType == EmploymentType.ESTUDIOS_GENERALES) {
            return CourseCategory.ESTUDIOS_GENERALES;
        }
        return CourseCategory.CARRERA;
    }

    private void applyTeacherFields(
            Teacher teacher,
            String firstName,
            String lastName,
            String email,
            String phone,
            EmploymentType employmentType,
            List<TeacherShift> shifts) {
        teacher.setFirstName(firstName.trim());
        teacher.setLastName(lastName.trim());
        teacher.setEmail(blankToNull(email));
        teacher.setPhone(blankToNull(phone));
        teacher.setEmploymentType(employmentType);
        teacher.setShifts(new LinkedHashSet<>(shifts));
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
