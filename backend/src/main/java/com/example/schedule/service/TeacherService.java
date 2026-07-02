package com.example.schedule.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule.config.NombradosSeedData;
import com.example.schedule.config.NombradosSeedData.DayChoicePattern;
import com.example.schedule.config.NombradosSeedData.TeacherSeed;
import com.example.schedule.dto.CreateTeacherRequest;
import com.example.schedule.dto.TeacherAssignmentRequest;
import com.example.schedule.dto.TeacherResponse;
import com.example.schedule.dto.UpdateTeacherRequest;
import com.example.schedule.entity.Course;
import com.example.schedule.entity.Teacher;
import com.example.schedule.entity.TeacherAssignment;
import com.example.schedule.model.CourseCategory;
import com.example.schedule.model.EmploymentType;
import com.example.schedule.model.TeacherShift;
import com.example.schedule.repository.CourseRepository;
import com.example.schedule.repository.TeacherRepository;

@Service
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final CourseRepository courseRepository;
    private final JdbcTemplate jdbcTemplate;

    public TeacherService(
            TeacherRepository teacherRepository,
            CourseRepository courseRepository,
            JdbcTemplate jdbcTemplate) {
        this.teacherRepository = teacherRepository;
        this.courseRepository = courseRepository;
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
        List<Course> linkedCourses = courseRepository.findByTeacherId(id);
        if (!linkedCourses.isEmpty()) {
            String courseNames = linkedCourses.stream()
                    .map(Course::getName)
                    .distinct()
                    .collect(Collectors.joining(", "));
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar el docente porque está asignado a: " + courseNames);
        }
        teacherRepository.delete(teacher);
    }

    @Transactional
    public void seedNombradosIfNeeded() {
        if (hasNombradosSeedFlag()) {
            return;
        }

        ensureSeedFlagsTable();
        clearCourseTeacherReferences();
        teacherRepository.deleteAll();

        for (TeacherSeed seed : NombradosSeedData.TEACHERS) {
            List<TeacherAssignmentRequest> assignments = toSeedAssignmentRequests(seed);

            create(new CreateTeacherRequest(
                    seed.firstName(),
                    seed.lastName(),
                    seed.email(),
                    null,
                    EmploymentType.NOMBRADO,
                    seed.shifts(),
                    assignments));
        }
    }

    private List<TeacherAssignmentRequest> toSeedAssignmentRequests(TeacherSeed seed) {
        List<TeacherAssignmentRequest> assignments = NombradosSeedData.preferenceCourses(seed).stream()
                .map(course -> new TeacherAssignmentRequest(
                        course.courseName(),
                        CourseCategory.CARRERA,
                        course.cycle()))
                .toList();

        if (seed.dayPattern() == DayChoicePattern.OPTION_A) {
            if (assignments.size() != 1) {
                throw new IllegalStateException(
                        "Opción A requiere 1 preferencia de curso: " + seed.email());
            }
            return assignments;
        }

        long dayCourses = NombradosSeedData.preferenceCourses(seed).stream()
                .filter(course -> course.modality() != NombradosSeedData.ShiftModality.NIGHT)
                .count();
        if (dayCourses != 2) {
            throw new IllegalStateException(
                    "Opción B requiere 2 cursos de día: " + seed.email());
        }
        return assignments;
    }

    private void clearCourseTeacherReferences() {
        try {
            jdbcTemplate.update("""
                    UPDATE courses
                    SET morning_teacher_id = NULL,
                        afternoon_teacher_id = NULL,
                        night_teacher_id = NULL
                    """);
        } catch (Exception ignored) {
            // Table may not exist yet on first bootstrap.
        }
    }

    private void ensureSeedFlagsTable() {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS app_seed_flags (
                        flag_key VARCHAR(100) PRIMARY KEY,
                        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                    """);
        } catch (Exception ignored) {
            // Database may not be ready yet.
        }
    }

    boolean hasNombradosSeedFlag() {
        ensureSeedFlagsTable();
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM app_seed_flags WHERE flag_key = ?",
                    Integer.class,
                    NombradosSeedData.SEED_FLAG);
            return count != null && count > 0;
        } catch (Exception ignored) {
            return false;
        }
    }

    void markNombradosSeedFlag() {
        ensureSeedFlagsTable();
        jdbcTemplate.update(
                "INSERT INTO app_seed_flags (flag_key) VALUES (?) ON CONFLICT (flag_key) DO NOTHING",
                NombradosSeedData.SEED_FLAG);
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
