package com.example.schedule.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule.config.NombradosSeedData;
import com.example.schedule.config.NombradosSeedData.CourseAssignment;
import com.example.schedule.config.NombradosSeedData.ShiftModality;
import com.example.schedule.config.NombradosSeedData.TeacherSeed;
import com.example.schedule.dto.CourseResponse;
import com.example.schedule.dto.CourseSpaceAssignmentRequest;
import com.example.schedule.dto.CreateCourseRequest;
import com.example.schedule.dto.UpdateCourseRequest;
import com.example.schedule.entity.Course;
import com.example.schedule.entity.CourseSpaceAssignment;
import com.example.schedule.entity.Space;
import com.example.schedule.entity.Teacher;
import com.example.schedule.model.CourseAvailability;
import com.example.schedule.model.CourseCycleRules;
import com.example.schedule.model.CourseType;
import com.example.schedule.model.TeacherShift;
import com.example.schedule.repository.CourseRepository;
import com.example.schedule.repository.SpaceRepository;
import com.example.schedule.repository.TeacherRepository;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final TeacherRepository teacherRepository;
    private final SpaceRepository spaceRepository;
    private final TeacherService teacherService;
    private final JdbcTemplate jdbcTemplate;

    public CourseService(
            CourseRepository courseRepository,
            TeacherRepository teacherRepository,
            SpaceRepository spaceRepository,
            TeacherService teacherService,
            JdbcTemplate jdbcTemplate) {
        this.courseRepository = courseRepository;
        this.teacherRepository = teacherRepository;
        this.spaceRepository = spaceRepository;
        this.teacherService = teacherService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> findAll(
            CourseType type,
            CourseAvailability availability,
            TeacherShift shift,
            Integer cycle) {
        return courseRepository.findByFilters(type, cycle).stream()
                .filter(course -> matchesShift(course, shift))
                .filter(course -> matchesAvailability(course, availability))
                .map(CourseResponse::from)
                .toList();
    }

    private boolean matchesShift(Course course, TeacherShift shift) {
        if (shift == null) {
            return true;
        }
        return switch (shift) {
            case MANANA -> course.getMorningTeacher() != null;
            case TARDE -> course.getAfternoonTeacher() != null;
            case NOCHE -> course.getNightTeacher() != null;
        };
    }

    private boolean matchesAvailability(Course course, CourseAvailability availability) {
        if (availability == null) {
            return true;
        }
        CourseAvailability computed = CourseResponse.computeAvailability(course);
        return computed == availability;
    }

    @Transactional(readOnly = true)
    public CourseResponse findById(Long id) {
        return CourseResponse.from(getCourseOrThrow(id));
    }

    @Transactional
    public CourseResponse create(CreateCourseRequest request) {
        ensureUniqueCode(request.code(), null);
        Course course = new Course();
        applyCourseFields(
                course,
                request.name(),
                request.code(),
                request.type(),
                request.lectivo(),
                request.cycle(),
                request.morningTeacherId(),
                request.afternoonTeacherId(),
                request.nightTeacherId());
        course.replaceSpaceAssignments(toSpaceAssignments(request.spaceAssignments()));
        return CourseResponse.from(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse update(Long id, UpdateCourseRequest request) {
        ensureUniqueCode(request.code(), id);
        Course course = getCourseOrThrow(id);
        applyCourseFields(
                course,
                request.name(),
                request.code(),
                request.type(),
                request.lectivo(),
                request.cycle(),
                request.morningTeacherId(),
                request.afternoonTeacherId(),
                request.nightTeacherId());
        course.replaceSpaceAssignments(toSpaceAssignments(request.spaceAssignments()));
        return CourseResponse.from(courseRepository.save(course));
    }

    @Transactional
    public void delete(Long id) {
        Course course = getCourseOrThrow(id);
        courseRepository.delete(course);
    }

    @Transactional
    public void seedFromPlanIfEmpty() {
        if (courseRepository.count() > 0) {
            return;
        }

        for (CourseSeed seed : PLAN_COURSES) {
            create(new CreateCourseRequest(
                    seed.name(),
                    seed.code(),
                    seed.type(),
                    seed.lectivo(),
                    seed.cycle(),
                    null,
                    null,
                    null,
                    List.of()));
        }
    }

    @Transactional
    public void applyNombradosAssignmentsIfNeeded() {
        if (teacherService.hasNombradosSeedFlag()) {
            return;
        }

        for (CourseAssignment assignment : NombradosSeedData.COURSE_ASSIGNMENTS) {
            TeacherSeed teacherSeed = NombradosSeedData.TEACHERS.get(assignment.teacherIndex());
            Teacher teacher = teacherRepository.findByEmail(teacherSeed.email())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.INTERNAL_SERVER_ERROR,
                            "Docente de seed no encontrado: " + teacherSeed.email()));
            Course course = courseRepository.findByCode(assignment.courseCode())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.INTERNAL_SERVER_ERROR,
                            "Curso de seed no encontrado: " + assignment.courseCode()));

            applyNombradoAssignment(course, teacher, assignment.modality());
            courseRepository.save(course);
        }

        teacherService.markNombradosSeedFlag();
    }

    private void applyNombradoAssignment(Course course, Teacher teacher, ShiftModality modality) {
        if (CourseCycleRules.isNightOnlyCycle(course.getCycle())) {
            if (modality != ShiftModality.NIGHT) {
                throw new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Asignación inválida para ciclo nocturno: " + course.getCode());
            }
            course.setNightTeacher(teacher);
            return;
        }

        switch (modality) {
            case BOTH -> {
                course.setMorningTeacher(teacher);
                course.setAfternoonTeacher(teacher);
            }
            case MORNING -> course.setMorningTeacher(teacher);
            case AFTERNOON -> course.setAfternoonTeacher(teacher);
            case NIGHT -> course.setNightTeacher(teacher);
        }
    }

    @Transactional
    public void migrateCourseCodesIfNeeded() {
        try {
            jdbcTemplate.execute("""
                    ALTER TABLE courses
                    ADD COLUMN IF NOT EXISTS code VARCHAR(50)
                    """);
            for (Map.Entry<String, String> entry : COURSE_CODES_BY_NAME.entrySet()) {
                jdbcTemplate.update(
                        "UPDATE courses SET code = ? WHERE name = ? AND (code IS NULL OR code = '')",
                        entry.getValue(),
                        entry.getKey());
            }
            jdbcTemplate.execute("""
                    ALTER TABLE courses
                    ALTER COLUMN code SET NOT NULL
                    """);
            jdbcTemplate.execute("""
                    CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_code ON courses (code)
                    """);
        } catch (Exception ignored) {
            // Table or column may not exist yet on first bootstrap.
        }
    }

    @Transactional
    public void migrateLectivosIfNeeded() {
        try {
            jdbcTemplate.execute("""
                    ALTER TABLE courses
                    ADD COLUMN IF NOT EXISTS lectivo boolean DEFAULT false
                    """);
            jdbcTemplate.execute("""
                    UPDATE courses
                    SET lectivo = false
                    WHERE lectivo IS NULL
                    """);
            jdbcTemplate.execute("""
                    ALTER TABLE courses
                    ALTER COLUMN lectivo SET NOT NULL
                    """);
            jdbcTemplate.execute("""
                    ALTER TABLE courses
                    ALTER COLUMN lectivo SET DEFAULT false
                    """);
            jdbcTemplate.execute("""
                    ALTER TABLE courses
                    DROP CONSTRAINT IF EXISTS courses_type_check
                    """);
            jdbcTemplate.execute("""
                    ALTER TABLE courses
                    ADD CONSTRAINT courses_type_check
                    CHECK (type IN ('ESTUDIOS_GENERALES', 'DE_CARRERA'))
                    """);
            jdbcTemplate.execute("""
                    UPDATE courses
                    SET type = 'DE_CARRERA', lectivo = true
                    WHERE type = 'LECTIVOS'
                    """);
        } catch (Exception ignored) {
            // Table or column may not exist yet on first bootstrap.
        }
    }

    private void applyCourseFields(
            Course course,
            String name,
            String code,
            CourseType type,
            boolean lectivo,
            Integer cycle,
            Long morningTeacherId,
            Long afternoonTeacherId,
            Long nightTeacherId) {
        course.setName(name.trim());
        course.setCode(normalizeCode(code));
        course.setType(type);
        course.setLectivo(lectivo);
        course.setCycle(cycle);
        if (CourseCycleRules.isNightOnlyCycle(cycle)) {
            morningTeacherId = null;
            afternoonTeacherId = null;
        }
        course.setMorningTeacher(resolveTeacher(morningTeacherId));
        course.setAfternoonTeacher(resolveTeacher(afternoonTeacherId));
        course.setNightTeacher(resolveTeacher(nightTeacherId));
    }

    private Teacher resolveTeacher(Long teacherId) {
        if (teacherId == null) {
            return null;
        }
        return teacherRepository.findById(teacherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Docente no encontrado"));
    }

    private List<CourseSpaceAssignment> toSpaceAssignments(List<CourseSpaceAssignmentRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }
        return requests.stream()
                .map(this::toSpaceAssignment)
                .toList();
    }

    private CourseSpaceAssignment toSpaceAssignment(CourseSpaceAssignmentRequest request) {
        Space space = spaceRepository.findById(request.spaceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Espacio no encontrado"));
        CourseSpaceAssignment assignment = new CourseSpaceAssignment();
        assignment.setSpace(space);
        return assignment;
    }

    private Course getCourseOrThrow(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Curso no encontrado"));
    }

    private void ensureUniqueCode(String code, Long excludeId) {
        String normalized = normalizeCode(code);
        boolean exists = excludeId == null
                ? courseRepository.existsByCode(normalized)
                : courseRepository.existsByCodeAndIdNot(normalized, excludeId);
        if (exists) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El código de curso ya existe");
        }
    }

    private static String normalizeCode(String code) {
        return code.trim();
    }

    private record CourseSeed(String name, String code, CourseType type, boolean lectivo, int cycle) {
    }

    private static final List<CourseSeed> PLAN_COURSES = List.of(
            // Ciclo I
            new CourseSeed("Comunicación", "ISEG240101", CourseType.ESTUDIOS_GENERALES, false, 1),
            new CourseSeed("Matemática Básica I", "ISEG240102", CourseType.ESTUDIOS_GENERALES, false, 1),
            new CourseSeed("Métodos de Estudios Universitarios", "ISEG240103", CourseType.ESTUDIOS_GENERALES, false, 1),
            new CourseSeed("Derechos Fundamentales de la Persona y de la Sociedad", "ISEG240104", CourseType.ESTUDIOS_GENERALES, false, 1),
            new CourseSeed("Teoría General de Sistemas", "ISEE240105", CourseType.DE_CARRERA, false, 1),
            new CourseSeed("Algoritmo y Fundamentos de Programación", "ISES240106", CourseType.DE_CARRERA, false, 1),
            // Ciclo II
            new CourseSeed("Herramientas Digitales", "ISEG240201", CourseType.ESTUDIOS_GENERALES, false, 2),
            new CourseSeed("Matemática Básica II", "ISEG240202", CourseType.ESTUDIOS_GENERALES, false, 2),
            new CourseSeed("Desarrollo Personal", "ISEG240203", CourseType.ESTUDIOS_GENERALES, false, 2),
            new CourseSeed("Física General", "ISEE240204", CourseType.DE_CARRERA, false, 2),
            new CourseSeed("Estructura de Datos", "ISES240205", CourseType.DE_CARRERA, false, 2),
            new CourseSeed("Dibujo CAD", "ISES240206", CourseType.DE_CARRERA, false, 2),
            // Ciclo III
            new CourseSeed("Filosofía y Ética", "ISEG240301", CourseType.ESTUDIOS_GENERALES, false, 3),
            new CourseSeed("Realidad Nacional e Internacional", "ISEG240302", CourseType.ESTUDIOS_GENERALES, false, 3),
            new CourseSeed("Emprendimiento e Innovación", "ISEG240303", CourseType.ESTUDIOS_GENERALES, false, 3),
            new CourseSeed("Matemática Superior", "ISEE240304", CourseType.DE_CARRERA, false, 3),
            new CourseSeed("Investigación Operativa I", "ISEE240305", CourseType.DE_CARRERA, false, 3),
            new CourseSeed("Programación Orientada a Objetos", "ISES240306", CourseType.DE_CARRERA, false, 3),
            // Ciclo IV
            new CourseSeed("Cultura Ambiental y Responsabilidad Social", "ISEG240401", CourseType.ESTUDIOS_GENERALES, false, 4),
            new CourseSeed("Derecho Empresarial", "ISEG240402", CourseType.ESTUDIOS_GENERALES, false, 4),
            new CourseSeed("Estadística y Probabilidades", "ISEE240403", CourseType.DE_CARRERA, false, 4),
            new CourseSeed("Investigación Operativa II", "ISEE240404", CourseType.DE_CARRERA, false, 4),
            new CourseSeed("Sistemas Digitales", "ISES240405", CourseType.DE_CARRERA, false, 4),
            new CourseSeed("Fundamentos de Base de Datos", "ISES240406", CourseType.DE_CARRERA, false, 4),
            new CourseSeed("Desarrollo Web Full Stack", "ISES240407", CourseType.DE_CARRERA, false, 4),
            // Ciclo V
            new CourseSeed("Estadística Inferencial", "ISEE240501", CourseType.DE_CARRERA, false, 5),
            new CourseSeed("Introducción al Networking", "ISES240502", CourseType.DE_CARRERA, false, 5),
            new CourseSeed("Arquitectura de Computadoras", "ISES240503", CourseType.DE_CARRERA, false, 5),
            new CourseSeed("Administración de Base de Datos", "ISES240504", CourseType.DE_CARRERA, false, 5),
            new CourseSeed("Desarrollo de Aplicaciones Móviles", "ISES240505", CourseType.DE_CARRERA, false, 5),
            new CourseSeed("Simulación de Sistemas", "ISES240506", CourseType.DE_CARRERA, false, 5),
            new CourseSeed("Ingeniería de Costos", "ISES240507", CourseType.DE_CARRERA, false, 5),
            // Ciclo VI
            new CourseSeed("Diseño de Redes de Comunicaciones", "ISES240601", CourseType.DE_CARRERA, false, 6),
            new CourseSeed("Configuración de Servidores", "ISES240602", CourseType.DE_CARRERA, false, 6),
            new CourseSeed("Data Warehouse", "ISES240603", CourseType.DE_CARRERA, false, 6),
            new CourseSeed("Arquitectura de Software", "ISES240604", CourseType.DE_CARRERA, false, 6),
            new CourseSeed("Inteligencia Artificial y Sistemas Expertos", "ISES240605", CourseType.DE_CARRERA, false, 6),
            new CourseSeed("Diseño de Procesos de Negocios", "ISES240606", CourseType.DE_CARRERA, false, 6),
            // Ciclo VII
            new CourseSeed("Metodología de la Investigación Científica", "ISEE240701", CourseType.DE_CARRERA, false, 7),
            new CourseSeed("Administración de Redes de Comunicaciones", "ISES240702", CourseType.DE_CARRERA, false, 7),
            new CourseSeed("Big Data", "ISES240703", CourseType.DE_CARRERA, false, 7),
            new CourseSeed("Desarrollo de Aplicaciones con DevOps", "ISES240704", CourseType.DE_CARRERA, false, 7),
            new CourseSeed("Machine Learning", "ISES240705", CourseType.DE_CARRERA, false, 7),
            new CourseSeed("Análisis de Sistemas", "ISES240706", CourseType.DE_CARRERA, false, 7),
            // Ciclo VIII
            new CourseSeed("Proceso de la Investigación Científica", "ISEE240801", CourseType.DE_CARRERA, false, 8),
            new CourseSeed("Seguridad y Criptografía", "ISES240802", CourseType.DE_CARRERA, false, 8),
            new CourseSeed("Internet de las Cosas", "ISES240803", CourseType.DE_CARRERA, false, 8),
            new CourseSeed("Testing y Aseguramiento de la Calidad en Desarrollo de Software", "ISES240804", CourseType.DE_CARRERA, false, 8),
            new CourseSeed("Deep Learning", "ISES240805", CourseType.DE_CARRERA, false, 8),
            new CourseSeed("Gestión de Proyectos", "ISES240806", CourseType.DE_CARRERA, false, 8),
            // Ciclo IX
            new CourseSeed("Seminario Tesis I", "ISEE240901", CourseType.DE_CARRERA, false, 9),
            new CourseSeed("Práctica Preprofesional I", "ISEE240902", CourseType.DE_CARRERA, false, 9),
            new CourseSeed("Ciberseguridad", "ISES240903", CourseType.DE_CARRERA, false, 9),
            new CourseSeed("Programación Funcional y Reactiva", "ISES240904", CourseType.DE_CARRERA, false, 9),
            new CourseSeed("Inteligencia de Negocios", "ISES240905", CourseType.DE_CARRERA, false, 9),
            new CourseSeed("Electivo I", "IS-ELECTIVO-I", CourseType.DE_CARRERA, true, 9),
            // Ciclo X
            new CourseSeed("Seminario Tesis II", "ISEE241001", CourseType.DE_CARRERA, false, 10),
            new CourseSeed("Práctica Preprofesional II", "ISEE241002", CourseType.DE_CARRERA, false, 10),
            new CourseSeed("Cloud Computing", "ISES241003", CourseType.DE_CARRERA, false, 10),
            new CourseSeed("Auditoría y Legislación de TI", "ISES241004", CourseType.DE_CARRERA, false, 10),
            new CourseSeed("Gestión de Proyectos Sistémicos", "ISES241005", CourseType.DE_CARRERA, false, 10),
            new CourseSeed("Electivo II", "IS-ELECTIVO-II", CourseType.DE_CARRERA, true, 10));

    private static final Map<String, String> COURSE_CODES_BY_NAME = buildCourseCodesByName();

    private static Map<String, String> buildCourseCodesByName() {
        Map<String, String> codes = PLAN_COURSES.stream()
                .collect(Collectors.toMap(CourseSeed::name, CourseSeed::code));
        codes.put("Seminario de Tesis I", "ISEE240901");
        codes.put("Seminario de Tesis II", "ISEE241001");
        return codes;
    }
}
