package com.example.schedule.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule.dto.CourseResponse;
import com.example.schedule.dto.CourseSpaceAssignmentRequest;
import com.example.schedule.dto.CreateCourseRequest;
import com.example.schedule.dto.UpdateCourseRequest;
import com.example.schedule.entity.Course;
import com.example.schedule.entity.CourseSpaceAssignment;
import com.example.schedule.entity.Space;
import com.example.schedule.entity.Teacher;
import com.example.schedule.model.CourseAvailability;
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

    public CourseService(
            CourseRepository courseRepository,
            TeacherRepository teacherRepository,
            SpaceRepository spaceRepository) {
        this.courseRepository = courseRepository;
        this.teacherRepository = teacherRepository;
        this.spaceRepository = spaceRepository;
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
        Course course = new Course();
        applyCourseFields(course, request.name(), request.type(), request.cycle(),
                request.morningTeacherId(), request.afternoonTeacherId(), request.nightTeacherId());
        course.replaceSpaceAssignments(toSpaceAssignments(request.spaceAssignments()));
        return CourseResponse.from(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse update(Long id, UpdateCourseRequest request) {
        Course course = getCourseOrThrow(id);
        applyCourseFields(course, request.name(), request.type(), request.cycle(),
                request.morningTeacherId(), request.afternoonTeacherId(), request.nightTeacherId());
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
                    seed.type(),
                    seed.cycle(),
                    null,
                    null,
                    null,
                    List.of()));
        }
    }

    private void applyCourseFields(
            Course course,
            String name,
            CourseType type,
            Integer cycle,
            Long morningTeacherId,
            Long afternoonTeacherId,
            Long nightTeacherId) {
        course.setName(name.trim());
        course.setType(type);
        course.setCycle(cycle);
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

    private record CourseSeed(String name, CourseType type, int cycle) {
    }

    private static final List<CourseSeed> PLAN_COURSES = List.of(
            // Ciclo I
            new CourseSeed("Comunicación", CourseType.ESTUDIOS_GENERALES, 1),
            new CourseSeed("Matemática Básica I", CourseType.ESTUDIOS_GENERALES, 1),
            new CourseSeed("Métodos de Estudios Universitarios", CourseType.ESTUDIOS_GENERALES, 1),
            new CourseSeed("Derechos Fundamentales de la Persona y de la Sociedad", CourseType.ESTUDIOS_GENERALES, 1),
            new CourseSeed("Teoría General de Sistemas", CourseType.DE_CARRERA, 1),
            new CourseSeed("Algoritmo y Fundamentos de Programación", CourseType.DE_CARRERA, 1),
            // Ciclo II
            new CourseSeed("Herramientas Digitales", CourseType.ESTUDIOS_GENERALES, 2),
            new CourseSeed("Matemática Básica II", CourseType.ESTUDIOS_GENERALES, 2),
            new CourseSeed("Desarrollo Personal", CourseType.ESTUDIOS_GENERALES, 2),
            new CourseSeed("Física General", CourseType.DE_CARRERA, 2),
            new CourseSeed("Estructura de Datos", CourseType.DE_CARRERA, 2),
            new CourseSeed("Dibujo CAD", CourseType.DE_CARRERA, 2),
            // Ciclo III
            new CourseSeed("Filosofía y Ética", CourseType.ESTUDIOS_GENERALES, 3),
            new CourseSeed("Realidad Nacional e Internacional", CourseType.ESTUDIOS_GENERALES, 3),
            new CourseSeed("Emprendimiento e Innovación", CourseType.ESTUDIOS_GENERALES, 3),
            new CourseSeed("Matemática Superior", CourseType.DE_CARRERA, 3),
            new CourseSeed("Investigación Operativa I", CourseType.DE_CARRERA, 3),
            new CourseSeed("Programación Orientada a Objetos", CourseType.DE_CARRERA, 3),
            // Ciclo IV
            new CourseSeed("Cultura Ambiental y Responsabilidad Social", CourseType.ESTUDIOS_GENERALES, 4),
            new CourseSeed("Derecho Empresarial", CourseType.ESTUDIOS_GENERALES, 4),
            new CourseSeed("Estadística y Probabilidades", CourseType.DE_CARRERA, 4),
            new CourseSeed("Investigación Operativa II", CourseType.DE_CARRERA, 4),
            new CourseSeed("Sistemas Digitales", CourseType.DE_CARRERA, 4),
            new CourseSeed("Fundamentos de Base de Datos", CourseType.DE_CARRERA, 4),
            new CourseSeed("Desarrollo Web Full Stack", CourseType.DE_CARRERA, 4),
            // Ciclo V
            new CourseSeed("Estadística Inferencial", CourseType.DE_CARRERA, 5),
            new CourseSeed("Introducción al Networking", CourseType.DE_CARRERA, 5),
            new CourseSeed("Arquitectura de Computadoras", CourseType.DE_CARRERA, 5),
            new CourseSeed("Administración de Base de Datos", CourseType.DE_CARRERA, 5),
            new CourseSeed("Desarrollo de Aplicaciones Móviles", CourseType.DE_CARRERA, 5),
            new CourseSeed("Simulación de Sistemas", CourseType.DE_CARRERA, 5),
            new CourseSeed("Ingeniería de Costos", CourseType.DE_CARRERA, 5),
            // Ciclo VI
            new CourseSeed("Diseño de Redes de Comunicaciones", CourseType.DE_CARRERA, 6),
            new CourseSeed("Configuración de Servidores", CourseType.DE_CARRERA, 6),
            new CourseSeed("Data Warehouse", CourseType.DE_CARRERA, 6),
            new CourseSeed("Arquitectura de Software", CourseType.DE_CARRERA, 6),
            new CourseSeed("Inteligencia Artificial y Sistemas Expertos", CourseType.DE_CARRERA, 6),
            new CourseSeed("Diseño de Procesos de Negocios", CourseType.DE_CARRERA, 6),
            // Ciclo VII
            new CourseSeed("Metodología de la Investigación Científica", CourseType.DE_CARRERA, 7),
            new CourseSeed("Administración de Redes de Comunicaciones", CourseType.DE_CARRERA, 7),
            new CourseSeed("Big Data", CourseType.DE_CARRERA, 7),
            new CourseSeed("Desarrollo de Aplicaciones con DevOps", CourseType.DE_CARRERA, 7),
            new CourseSeed("Machine Learning", CourseType.DE_CARRERA, 7),
            new CourseSeed("Análisis de Sistemas", CourseType.DE_CARRERA, 7),
            // Ciclo VIII
            new CourseSeed("Proceso de la Investigación Científica", CourseType.DE_CARRERA, 8),
            new CourseSeed("Seguridad y Criptografía", CourseType.DE_CARRERA, 8),
            new CourseSeed("Internet de las Cosas", CourseType.DE_CARRERA, 8),
            new CourseSeed("Testing y Aseguramiento de la Calidad en Desarrollo de Software", CourseType.DE_CARRERA, 8),
            new CourseSeed("Deep Learning", CourseType.DE_CARRERA, 8),
            new CourseSeed("Gestión de Proyectos", CourseType.DE_CARRERA, 8),
            // Ciclo IX
            new CourseSeed("Seminario Tesis I", CourseType.DE_CARRERA, 9),
            new CourseSeed("Práctica Preprofesional I", CourseType.DE_CARRERA, 9),
            new CourseSeed("Ciberseguridad", CourseType.DE_CARRERA, 9),
            new CourseSeed("Programación Funcional y Reactiva", CourseType.DE_CARRERA, 9),
            new CourseSeed("Inteligencia de Negocios", CourseType.DE_CARRERA, 9),
            new CourseSeed("Electivo I", CourseType.LECTIVOS, 9),
            // Ciclo X
            new CourseSeed("Seminario Tesis II", CourseType.DE_CARRERA, 10),
            new CourseSeed("Práctica Preprofesional II", CourseType.DE_CARRERA, 10),
            new CourseSeed("Cloud Computing", CourseType.DE_CARRERA, 10),
            new CourseSeed("Auditoría y Legislación de TI", CourseType.DE_CARRERA, 10),
            new CourseSeed("Gestión de Proyectos Sistémicos", CourseType.DE_CARRERA, 10),
            new CourseSeed("Electivo II", CourseType.LECTIVOS, 10));
}
