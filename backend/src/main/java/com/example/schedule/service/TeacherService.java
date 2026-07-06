package com.example.schedule.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule.config.NombradosSeedData;
import com.example.schedule.config.NombradosSeedData.DayChoicePattern;
import com.example.schedule.config.NombradosSeedData.TeacherSeed;
import com.example.schedule.dto.CourseTeacherAssignmentRequest;
import com.example.schedule.dto.CreateTeacherRequest;
import com.example.schedule.dto.TeacherResponse;
import com.example.schedule.dto.UpdateTeacherRequest;
import com.example.schedule.entity.Course;
import com.example.schedule.entity.CourseTeacherAssignment;
import com.example.schedule.entity.Teacher;
import com.example.schedule.model.CourseCategory;
import com.example.schedule.model.CourseCycleRules;
import com.example.schedule.model.CourseType;
import com.example.schedule.model.EmploymentType;
import com.example.schedule.model.TeacherShift;
import com.example.schedule.repository.CourseRepository;
import com.example.schedule.repository.CourseTeacherAssignmentRepository;
import com.example.schedule.repository.TeacherRepository;

@Service
public class TeacherService {

    private static final int MAX_SHIFTS_PER_TEACHER = 2;

    private final TeacherRepository teacherRepository;
    private final CourseRepository courseRepository;
    private final CourseTeacherAssignmentRepository assignmentRepository;
    private final JdbcTemplate jdbcTemplate;

    public TeacherService(
            TeacherRepository teacherRepository,
            CourseRepository courseRepository,
            CourseTeacherAssignmentRepository assignmentRepository,
            JdbcTemplate jdbcTemplate) {
        this.teacherRepository = teacherRepository;
        this.courseRepository = courseRepository;
        this.assignmentRepository = assignmentRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<TeacherResponse> findAll(EmploymentType employmentType, Integer cycle) {
        return teacherRepository.findByFilters(employmentType, cycle).stream()
                .map(TeacherResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeacherResponse findById(Long id) {
        return TeacherResponse.from(getTeacherOrThrow(id));
    }

    @Transactional
    public TeacherResponse create(CreateTeacherRequest request) {
        validateAssignments(request.employmentType(), request.courseAssignments());
        Teacher teacher = new Teacher();
        applyTeacherFields(teacher, request.firstName(), request.lastName(),
                request.email(), request.phone(), request.employmentType());
        teacher.replaceCourseAssignments(toAssignments(teacher, request.courseAssignments()));
        Teacher saved = teacherRepository.save(teacher);
        syncDerivedCourses(saved);
        return TeacherResponse.from(saved);
    }

    @Transactional
    public TeacherResponse update(Long id, UpdateTeacherRequest request) {
        validateAssignments(request.employmentType(), request.courseAssignments());
        Teacher teacher = getTeacherOrThrow(id);
        Set<Long> previousCourseIds = teacher.getCourseAssignments().stream()
                .map(a -> a.getCourse().getId())
                .collect(Collectors.toSet());

        // Eliminar asignaciones viejas físicamente antes de agregar las nuevas
        // para evitar duplicados (Hibernate reordena INSERT antes que DELETE).
        List<Long> assignmentIds = teacher.getCourseAssignments().stream()
                .map(CourseTeacherAssignment::getId)
                .filter(java.util.Objects::nonNull)
                .toList();
        teacher.getCourseAssignments().clear();
        teacherRepository.save(teacher);
        teacherRepository.flush();
        for (Long assignmentId : assignmentIds) {
            assignmentRepository.deleteById(assignmentId);
        }
        assignmentRepository.flush();

        applyTeacherFields(teacher, request.firstName(), request.lastName(),
                request.email(), request.phone(), request.employmentType());
        teacher.replaceCourseAssignments(toAssignments(teacher, request.courseAssignments()));
        Teacher saved = teacherRepository.save(teacher);
        syncDerivedCourses(saved);

        Set<Long> currentCourseIds = saved.getCourseAssignments().stream()
                .map(a -> a.getCourse().getId())
                .collect(Collectors.toSet());
        previousCourseIds.addAll(currentCourseIds);
        for (Long courseId : previousCourseIds) {
            courseRepository.findById(courseId).ifPresent(course -> {
                course.deriveShiftTeachers();
                courseRepository.save(course);
            });
        }
        return TeacherResponse.from(saved);
    }

    private void syncDerivedCourses(Teacher teacher) {
        for (var assignment : teacher.getCourseAssignments()) {
            Course course = assignment.getCourse();
            course.deriveShiftTeachers();
            courseRepository.save(course);
        }
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
        assignmentRepository.deleteAll();
        teacherRepository.deleteAll();

        for (TeacherSeed seed : NombradosSeedData.TEACHERS) {
            List<CourseTeacherAssignmentRequest> assignments = toSeedAssignmentRequests(seed);

            create(new CreateTeacherRequest(
                    seed.firstName(),
                    seed.lastName(),
                    seed.email(),
                    null,
                    EmploymentType.NOMBRADO,
                    assignments));
        }
    }

    private List<CourseTeacherAssignmentRequest> toSeedAssignmentRequests(TeacherSeed seed) {
        List<CourseTeacherAssignmentRequest> requests = new ArrayList<>();
        for (NombradosSeedData.TeacherCourseChoice course : NombradosSeedData.preferenceCourses(seed)) {
            Long courseId = resolveCourseIdByCode(course.courseCode());
            for (TeacherShift shift : shiftsFor(course.modality())) {
                requests.add(new CourseTeacherAssignmentRequest(courseId, shift));
            }
        }
        return requests;
    }

    private List<TeacherShift> shiftsFor(NombradosSeedData.ShiftModality modality) {
        return switch (modality) {
            case BOTH -> List.of(TeacherShift.MANANA, TeacherShift.TARDE);
            case MORNING -> List.of(TeacherShift.MANANA);
            case AFTERNOON -> List.of(TeacherShift.TARDE);
            case NIGHT -> List.of(TeacherShift.NOCHE);
        };
    }

    private Long resolveCourseIdByCode(String courseCode) {
        return courseRepository.findByCode(courseCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Curso de seed no encontrado: " + courseCode))
                .getId();
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
        }
    }

    @Transactional
    public void migrateLegacyShiftsIfNeeded() {
        try {
            jdbcTemplate.execute("DROP TABLE IF EXISTS teacher_shifts");
        } catch (Exception ignored) {
        }
    }

    private void validateAssignments(EmploymentType employmentType,
                                     List<CourseTeacherAssignmentRequest> assignments) {
        CourseCategory expectedCategory = expectedCourseCategory(employmentType);

        long distinctPairs = assignments.stream()
                .map(a -> a.courseId() + ":" + a.shift())
                .distinct()
                .count();
        if (distinctPairs != assignments.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Un docente no puede tener el mismo curso y turno asignado más de una vez");
        }

        long dayShifts = assignments.stream()
                .filter(a -> a.shift() == TeacherShift.MANANA || a.shift() == TeacherShift.TARDE)
                .count();
        long nightShifts = assignments.stream()
                .filter(a -> a.shift() == TeacherShift.NOCHE)
                .count();
        if (dayShifts + nightShifts > MAX_SHIFTS_PER_TEACHER) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Un docente puede tener como máximo 2 turnos (día o noche). Actualmente: "
                            + dayShifts + " de día y " + nightShifts + " de noche.");
        }

        Set<CourseCategory> categories = new LinkedHashSet<>();
        for (CourseTeacherAssignmentRequest req : assignments) {
            Course course = courseRepository.findById(req.courseId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Curso no encontrado: " + req.courseId()));
            categories.add(categoryFor(course.getType()));
            if (CourseCycleRules.isNightOnlyCycle(course.getCycle()) && req.shift() != TeacherShift.NOCHE) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El curso " + course.getCode() + " es de ciclo nocturno, solo turno NOCHE");
            }
            if (CourseCycleRules.isDayOnlyCycle(course.getCycle()) && req.shift() == TeacherShift.NOCHE) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El curso " + course.getCode() + " es de ciclo diurno (I–VIII), solo turnos MAÑANA o TARDE");
            }
        }
        if (categories.size() > 1 || (!categories.isEmpty() && !categories.contains(expectedCategory))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Las asignaciones no coinciden con el tipo de docente seleccionado");
        }
    }

    private CourseCategory categoryFor(CourseType type) {
        return type == CourseType.ESTUDIOS_GENERALES
                ? CourseCategory.ESTUDIOS_GENERALES
                : CourseCategory.CARRERA;
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
            EmploymentType employmentType) {
        teacher.setFirstName(firstName.trim());
        teacher.setLastName(lastName.trim());
        teacher.setEmail(blankToNull(email));
        teacher.setPhone(blankToNull(phone));
        teacher.setEmploymentType(employmentType);
    }

    private List<CourseTeacherAssignment> toAssignments(Teacher teacher,
                                                         List<CourseTeacherAssignmentRequest> requests) {
        return requests.stream()
                .map(req -> toAssignment(teacher, req))
                .toList();
    }

    private CourseTeacherAssignment toAssignment(Teacher teacher, CourseTeacherAssignmentRequest request) {
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Curso no encontrado: " + request.courseId()));
        CourseTeacherAssignment assignment = new CourseTeacherAssignment();
        assignment.setTeacher(teacher);
        assignment.setCourse(course);
        assignment.setShift(request.shift());
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
