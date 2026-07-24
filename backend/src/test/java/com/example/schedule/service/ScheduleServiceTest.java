package com.example.schedule.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule.dto.ScheduleResponse;
import com.example.schedule.entity.Course;
import com.example.schedule.entity.CourseTeacherAssignment;
import com.example.schedule.entity.ScheduleBlockSetting;
import com.example.schedule.entity.ScheduleSlot;
import com.example.schedule.entity.Space;
import com.example.schedule.entity.Teacher;
import com.example.schedule.model.CourseType;
import com.example.schedule.model.ScheduleWeekday;
import com.example.schedule.model.SpaceType;
import com.example.schedule.model.TeacherShift;
import com.example.schedule.repository.CourseRepository;
import com.example.schedule.repository.ScheduleBlockSettingRepository;
import com.example.schedule.repository.ScheduleSlotRepository;
import com.example.schedule.repository.SpaceRepository;

@ExtendWith(MockitoExtension.class)
class ScheduleServiceTest {

    @Mock
    private ScheduleSlotRepository scheduleSlotRepository;

    @Mock
    private ScheduleBlockSettingRepository scheduleBlockSettingRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private NotificationService notificationService;

    private ScheduleService scheduleService;

    @BeforeEach
    void setUp() {
        scheduleService = new ScheduleService(
                scheduleSlotRepository,
                scheduleBlockSettingRepository,
                courseRepository,
                spaceRepository,
                notificationService);
    }

    @Test
    void generateDistribuyeCursosDelMismoDocenteSinCruces() {
        Teacher teacher = teacher(1L, "Ana");
        Course courseA = course(101L, "ISEG240104", "Algoritmos", 1);
        Course courseB = course(102L, "IS-ELECTIVO-I", "Arquitectura", 1);
        assignment(1001L, courseA, teacher, TeacherShift.MANANA, null);
        assignment(1002L, courseB, teacher, TeacherShift.MANANA, null);

        when(scheduleBlockSettingRepository.findBySemester("26-II")).thenReturn(defaultSettings());
        when(spaceRepository.findAll()).thenReturn(List.of());
        when(courseRepository.findByFilters("26-II", null, 1)).thenReturn(List.of(courseA, courseB));
        when(scheduleSlotRepository.findBySemester("26-II")).thenReturn(List.of());
        ScheduleResponse response = scheduleService.generate("26-II", 1);

        assertEquals(2, response.slots().size());
        assertTrue(response.generated());

        var first = response.slots().get(0);
        var second = response.slots().get(1);
        assertEquals("08:00", first.startTime());
        assertEquals("11:00", first.endTime());
        assertEquals("11:00", second.startTime());
        assertEquals("14:00", second.endTime());
        assertFalse(overlaps(first.startTime(), first.endTime(), second.startTime(), second.endTime()));

        verify(scheduleSlotRepository).deleteBySemesterAndCycle("26-II", 1);
        verify(scheduleSlotRepository).saveAll(org.mockito.ArgumentMatchers.argThat(slots -> {
            int count = 0;
            for (ScheduleSlot ignored : slots) {
                count += 1;
            }
            return count == 2;
        }));
    }

    @Test
    void generateFallaSiNoExisteHuecoSinConflictos() {
        Teacher teacher = teacher(1L, "Luis");
        Course course = course(103L, "ISEG240104", "Redes", 1);
        assignment(1003L, course, teacher, TeacherShift.MANANA, null);

        List<ScheduleSlot> lockedSlots = List.of(
                lockedSlot(teacher, ScheduleWeekday.MONDAY),
                lockedSlot(teacher, ScheduleWeekday.TUESDAY),
                lockedSlot(teacher, ScheduleWeekday.WEDNESDAY),
                lockedSlot(teacher, ScheduleWeekday.THURSDAY),
                lockedSlot(teacher, ScheduleWeekday.FRIDAY));

        when(scheduleBlockSettingRepository.findBySemester("26-II")).thenReturn(defaultSettings());
        when(spaceRepository.findAll()).thenReturn(List.of());
        when(courseRepository.findByFilters("26-II", null, 1)).thenReturn(List.of(course));
        when(scheduleSlotRepository.findBySemester("26-II")).thenReturn(lockedSlots);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> scheduleService.generate("26-II", 1));

        assertEquals(409, error.getStatusCode().value());
        assertTrue(error.getReason().contains("sin conflictos"));
        verify(scheduleSlotRepository, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void getScheduleAdvierteCuandoDosCursosCompartenDiaTurnoYCiclo() {
        Teacher teacherA = teacher(1L, "Ana");
        Teacher teacherB = teacher(2L, "Beto");
        Course courseA = course(201L, "ISEG240104", "Algoritmos", 1);
        Course courseB = course(202L, "IS-ELECTIVO-I", "Electivo", 1);
        assignment(2001L, courseA, teacherA, TeacherShift.MANANA, ScheduleWeekday.MONDAY);
        assignment(2002L, courseB, teacherB, TeacherShift.MANANA, ScheduleWeekday.MONDAY);

        when(scheduleBlockSettingRepository.findBySemester("26-II")).thenReturn(defaultSettings());
        when(spaceRepository.findAll()).thenReturn(List.of());
        when(courseRepository.findByFilters("26-II", null, 1)).thenReturn(List.of(courseA, courseB));

        ScheduleResponse response = scheduleService.getSchedule("26-II", 1);

        assertFalse(response.warnings().isEmpty());
        assertTrue(response.warnings().stream().anyMatch(warning -> warning.contains("Día ocupado")));
    }

    private static Teacher teacher(Long id, String firstName) {
        Teacher teacher = new Teacher();
        teacher.setId(id);
        teacher.setFirstName(firstName);
        teacher.setLastName("Docente");
        teacher.setSemester("26-II");
        return teacher;
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

    private static CourseTeacherAssignment assignment(
            Long id,
            Course course,
            Teacher teacher,
            TeacherShift shift,
            ScheduleWeekday weekday) {
        CourseTeacherAssignment assignment = new CourseTeacherAssignment();
        assignment.setId(id);
        assignment.setCourse(course);
        assignment.setTeacher(teacher);
        assignment.setShift(shift);
        assignment.setWeekday(weekday);
        course.getTeacherAssignments().add(assignment);
        teacher.getCourseAssignments().add(assignment);
        return assignment;
    }

    private static List<ScheduleBlockSetting> defaultSettings() {
        return List.of(
                block("26-II", "MANANA", "Mañana", 8, 0, 15, 0),
                block("26-II", "TARDE", "Tarde", 15, 0, 20, 0),
                block("26-II", "NOCHE", "Noche", 20, 0, 23, 0));
    }

    private static ScheduleBlockSetting block(
            String semester,
            String blockId,
            String label,
            int startHour,
            int startMinute,
            int endHour,
            int endMinute) {
        ScheduleBlockSetting setting = new ScheduleBlockSetting();
        setting.setSemester(semester);
        setting.setBlockId(blockId);
        setting.setLabel(label);
        setting.setStartTime(LocalTime.of(startHour, startMinute));
        setting.setEndTime(LocalTime.of(endHour, endMinute));
        return setting;
    }

    private static ScheduleSlot lockedSlot(Teacher teacher, ScheduleWeekday weekday) {
        ScheduleSlot locked = new ScheduleSlot();
        locked.setSemester("26-II");
        locked.setCycle(2);
        locked.setCourse(course(999L + weekday.ordinal(), "LOCKED-" + weekday.name(), "Bloqueado " + weekday.name(), 2));
        locked.setTeacher(teacher);
        locked.setWeekday(weekday);
        locked.setShift(TeacherShift.MANANA);
        locked.setStartTime(LocalTime.of(8, 0));
        locked.setEndTime(LocalTime.of(15, 0));
        locked.setSettingsFingerprint("fp");
        return locked;
    }

    private static boolean overlaps(String leftStart, String leftEnd, String rightStart, String rightEnd) {
        return leftStart.compareTo(rightEnd) < 0 && rightStart.compareTo(leftEnd) < 0;
    }
}
