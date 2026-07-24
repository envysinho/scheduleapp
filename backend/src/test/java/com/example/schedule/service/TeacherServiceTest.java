package com.example.schedule.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule.entity.Course;
import com.example.schedule.entity.CourseTeacherAssignment;
import com.example.schedule.repository.CourseRepository;
import com.example.schedule.repository.CourseTeacherAssignmentRepository;
import com.example.schedule.repository.TeacherRepository;
import com.example.schedule.model.CourseType;
import com.example.schedule.model.ScheduleWeekday;
import com.example.schedule.model.SpaceType;
import com.example.schedule.model.EmploymentType;
import com.example.schedule.model.SubShift;
import com.example.schedule.model.TeacherShift;
import com.example.schedule.entity.Teacher;
import com.example.schedule.dto.CourseTeacherAssignmentRequest;
import com.example.schedule.dto.CreateTeacherRequest;

@ExtendWith(MockitoExtension.class)
class TeacherServiceTest {

    @Mock
    private TeacherRepository teacherRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseTeacherAssignmentRepository assignmentRepository;

    @Mock
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Mock
    private NotificationService notificationService;

    private TeacherService teacherService;

    @BeforeEach
    void setUp() {
        teacherService = new TeacherService(
                teacherRepository,
                courseRepository,
                assignmentRepository,
                jdbcTemplate,
                notificationService);
    }

    @Test
    void updateAssignmentWeekdayRechazaDiaOcupadoEnMismoCicloYTurno() {
        Course targetCourse = course(1L, "ISEG240104", "Algoritmos", 1);
        Teacher targetTeacher = teacher(1L);
        CourseTeacherAssignment target = assignment(11L, targetCourse, targetTeacher, TeacherShift.MANANA);

        Course otherCourse = course(2L, "IS-ELECTIVO-I", "Electivo", 1);
        Teacher otherTeacher = teacher(2L);
        CourseTeacherAssignment occupied = assignment(12L, otherCourse, otherTeacher, TeacherShift.MANANA);
        occupied.setWeekday(ScheduleWeekday.MONDAY);

        when(assignmentRepository.findById(11L)).thenReturn(java.util.Optional.of(target));
        when(assignmentRepository.findByWeekday(ScheduleWeekday.MONDAY)).thenReturn(List.of(occupied));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> teacherService.updateAssignmentWeekday(11L, ScheduleWeekday.MONDAY));

        assertEquals(409, error.getStatusCode().value());
        assertEquals(
                "El día ya está ocupado por IS-ELECTIVO-I en el mismo ciclo y turno. Recomendado: mover a otro día.",
                error.getReason());
    }

    @Test
    void updateAssignmentWeekdayAceptaDiaLibre() {
        Course course = course(1L, "ISEG240104", "Algoritmos", 1);
        Teacher teacher = teacher(1L);
        CourseTeacherAssignment target = assignment(11L, course, teacher, TeacherShift.MANANA);

        when(assignmentRepository.findById(11L)).thenReturn(java.util.Optional.of(target));
        when(assignmentRepository.findByWeekday(ScheduleWeekday.TUESDAY)).thenReturn(List.of());
        when(assignmentRepository.save(target)).thenReturn(target);

        CourseTeacherAssignment saved = teacherService.updateAssignmentWeekday(11L, ScheduleWeekday.TUESDAY);

        assertEquals(ScheduleWeekday.TUESDAY, saved.getWeekday());
        verify(assignmentRepository).save(target);
    }

    @Test
    void createRechazaSlotTomadoPorOtroDocenteEnMismoTurno() {
        Course course = course(1L, "ISEG240104", "Algoritmos", 1);
        Teacher occupiedTeacher = teacher(2L);
        CourseTeacherAssignment occupied = assignment(12L, course, occupiedTeacher, TeacherShift.MANANA);

        when(courseRepository.findById(1L)).thenReturn(java.util.Optional.of(course));
        when(assignmentRepository.findByCourseId(1L)).thenReturn(List.of(occupied));

        CreateTeacherRequest request = new CreateTeacherRequest(
                "Nuevo",
                "Docente",
                "26-II",
                null,
                null,
                EmploymentType.CONTRATADO,
                List.of(new CourseTeacherAssignmentRequest(1L, TeacherShift.MANANA, null, null)));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> teacherService.create(request));

        assertEquals(409, error.getStatusCode().value());
        assertEquals(
                "El curso ISEG240104 ya tiene docente asignado en MANANA. Libera ese slot antes de asignar otro docente.",
                error.getReason());
    }

    @Test
    void createRechazaSlotTomadoPorOtroDocenteEnMismoSubTurno() {
        Course course = course(1L, "ISEG240104", "Algoritmos", 1);
        course.setRequiredSpaceType(SpaceType.LABORATORIO);
        Teacher occupiedTeacher = teacher(2L);
        CourseTeacherAssignment occupied = assignment(12L, course, occupiedTeacher, TeacherShift.MANANA);
        occupied.setSubShift(SubShift.A1);

        when(courseRepository.findById(1L)).thenReturn(java.util.Optional.of(course));
        when(assignmentRepository.findByCourseId(1L)).thenReturn(List.of(occupied));

        CreateTeacherRequest request = new CreateTeacherRequest(
                "Nuevo",
                "Docente",
                "26-II",
                null,
                null,
                EmploymentType.CONTRATADO,
                List.of(new CourseTeacherAssignmentRequest(1L, TeacherShift.MANANA, SubShift.A1, null)));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> teacherService.create(request));

        assertEquals(409, error.getStatusCode().value());
        assertEquals(
                "El curso ISEG240104 ya tiene docente asignado en MANANA A1. Libera ese slot antes de asignar otro docente.",
                error.getReason());
    }

    @Test
    void updatePermiteMantenerSlotDelMismoDocente() {
        Course course = course(1L, "ISEG240104", "Algoritmos", 1);
        Teacher teacher = teacher(1L);
        CourseTeacherAssignment current = assignment(11L, course, teacher, TeacherShift.MANANA);
        teacher.setCourseAssignments(new java.util.ArrayList<>(List.of(current)));

        when(courseRepository.findById(1L)).thenReturn(java.util.Optional.of(course));
        when(assignmentRepository.findByCourseId(1L)).thenReturn(List.of(current));
        when(teacherRepository.findById(1L)).thenReturn(java.util.Optional.of(teacher));
        when(teacherRepository.save(any(Teacher.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> invocation.getArgument(0));

        teacherService.update(1L, new com.example.schedule.dto.UpdateTeacherRequest(
                "Doc",
                "Test",
                "26-II",
                null,
                null,
                EmploymentType.CONTRATADO,
                List.of(new CourseTeacherAssignmentRequest(1L, TeacherShift.MANANA, null, null))));
    }

    private static Course course(Long id, String code, String name, int cycle) {
        Course course = new Course();
        course.setId(id);
        course.setCode(code);
        course.setName(name);
        course.setSemester("26-II");
        course.setCycle(cycle);
        course.setType(CourseType.DE_CARRERA);
        course.setRequiredSpaceType(SpaceType.AULA);
        return course;
    }

    private static Teacher teacher(Long id) {
        Teacher teacher = new Teacher();
        teacher.setId(id);
        teacher.setFirstName("Doc");
        teacher.setLastName("Test");
        teacher.setSemester("26-II");
        return teacher;
    }

    private static CourseTeacherAssignment assignment(Long id, Course course, Teacher teacher, TeacherShift shift) {
        CourseTeacherAssignment assignment = new CourseTeacherAssignment();
        assignment.setId(id);
        assignment.setCourse(course);
        assignment.setTeacher(teacher);
        assignment.setShift(shift);
        return assignment;
    }
}
