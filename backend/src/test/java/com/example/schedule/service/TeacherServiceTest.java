package com.example.schedule.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
import com.example.schedule.model.TeacherShift;
import com.example.schedule.entity.Teacher;

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
