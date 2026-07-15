package com.example.schedule.service;

import java.time.Duration;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule.dto.ScheduleResponse;
import com.example.schedule.dto.ScheduleSlotResponse;
import com.example.schedule.entity.Course;
import com.example.schedule.entity.CourseSpaceAssignment;
import com.example.schedule.entity.CourseTeacherAssignment;
import com.example.schedule.entity.ScheduleBlockSetting;
import com.example.schedule.entity.ScheduleSlot;
import com.example.schedule.entity.Space;
import com.example.schedule.entity.SpaceAssignment;
import com.example.schedule.entity.Teacher;
import com.example.schedule.model.ScheduleWeekday;
import com.example.schedule.model.Semester;
import com.example.schedule.model.SubShift;
import com.example.schedule.model.TeacherShift;
import com.example.schedule.repository.CourseRepository;
import com.example.schedule.repository.ScheduleBlockSettingRepository;
import com.example.schedule.repository.ScheduleSlotRepository;
import com.example.schedule.repository.SpaceRepository;

@Service
public class ScheduleService {

    private static final List<ScheduleWeekday> WEEKDAYS = List.of(
            ScheduleWeekday.MONDAY,
            ScheduleWeekday.TUESDAY,
            ScheduleWeekday.WEDNESDAY,
            ScheduleWeekday.THURSDAY,
            ScheduleWeekday.FRIDAY);
    private static final int STEP_MINUTES = 15;
    private static final int ACADEMIC_MINUTES = 45;
    private static final int MAX_CHUNK_MINUTES = 24 * 60;

    private final ScheduleSlotRepository scheduleSlotRepository;
    private final ScheduleBlockSettingRepository scheduleBlockSettingRepository;
    private final CourseRepository courseRepository;
    private final SpaceRepository spaceRepository;
    private final NotificationService notificationService;

    public ScheduleService(
            ScheduleSlotRepository scheduleSlotRepository,
            ScheduleBlockSettingRepository scheduleBlockSettingRepository,
            CourseRepository courseRepository,
            SpaceRepository spaceRepository,
            NotificationService notificationService) {
        this.scheduleSlotRepository = scheduleSlotRepository;
        this.scheduleBlockSettingRepository = scheduleBlockSettingRepository;
        this.courseRepository = courseRepository;
        this.spaceRepository = spaceRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public ScheduleResponse getSchedule(String semester, Integer cycle) {
        String normalizedSemester = Semester.normalize(semester);
        validateCycle(cycle);
        ScheduleContext context = loadContext(normalizedSemester);
        List<String> warnings = new ArrayList<>();
        List<ScheduleSlot> slots = buildPreviewSlots(normalizedSemester, cycle, context, warnings);
        return new ScheduleResponse(
                normalizedSemester,
                cycle,
                !slots.isEmpty(),
                false,
                warnings,
                slots.stream().map(ScheduleSlotResponse::from).toList());
    }

    @Transactional
    public ScheduleResponse generate(String semester, Integer cycle) {
        String normalizedSemester = Semester.normalize(semester);
        validateCycle(cycle);
        ScheduleContext context = loadContext(normalizedSemester);
        List<ScheduleSlot> lockedSlots = scheduleSlotRepository.findBySemester(normalizedSemester).stream()
                .filter(slot -> !Objects.equals(slot.getCycle(), cycle))
                .toList();
        List<ScheduleSlot> generated = buildSlots(normalizedSemester, cycle, context, lockedSlots);

        scheduleSlotRepository.deleteBySemesterAndCycle(normalizedSemester, cycle);
        scheduleSlotRepository.flush();
        scheduleSlotRepository.saveAll(generated);
        notificationService.record("generó el horario del ciclo " + cycle + " para el semestre " + normalizedSemester);
        return getSchedule(normalizedSemester, cycle);
    }

    @Transactional
    public void regenerateExistingSchedulesForSemester(String semester) {
        String normalizedSemester = Semester.normalize(semester);
        List<Integer> cycles = scheduleSlotRepository.findDistinctCyclesBySemester(normalizedSemester);
        for (Integer cycle : cycles) {
            try {
                generate(normalizedSemester, cycle);
            } catch (RuntimeException ignored) {
                // El horario queda marcado como desactualizado por fingerprint y puede regenerarse manualmente.
            }
        }
    }

    private List<ScheduleSlot> buildSlots(
            String semester,
            Integer cycle,
            ScheduleContext context,
            List<ScheduleSlot> lockedSlots) {
        List<String> warnings = new ArrayList<>();
        List<AssignmentTask> tasks = assignmentTasks(semester, cycle, context.spaces(), warnings);
        if (tasks.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No hay asignaciones de docentes para generar el horario del ciclo " + cycle);
        }

        List<PlacedSlot> placed = new ArrayList<>();
        lockedSlots.forEach(slot -> placed.add(PlacedSlot.from(slot)));
        List<ScheduleSlot> generated = new ArrayList<>();

        for (AssignmentTask task : tasks) {
            int remaining = task.totalMinutes();
            while (remaining > 0) {
                int chunk = Math.min(remaining, Math.min(MAX_CHUNK_MINUTES, context.durationMinutes(task.shift())));
                PlacedSlot placedSlot = findSlot(task, chunk, context, placed);
                if (placedSlot == null) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "No se pudo ubicar " + task.course().getCode()
                                    + " (" + task.shiftLabel() + ") sin conflictos. "
                                    + "Revisa reglas, docentes, ambientes o sub-turnos.");
                }
                placed.add(placedSlot);
                generated.add(toEntity(semester, cycle, task, placedSlot, context.fingerprint()));
                remaining -= chunk;
            }
        }

        return generated;
    }

    private List<ScheduleSlot> buildPreviewSlots(
            String semester,
            Integer cycle,
            ScheduleContext context,
            List<String> warnings) {
        List<PlacedSlot> placed = new ArrayList<>();
        List<ScheduleSlot> preview = new ArrayList<>();

        for (int currentCycle = 1; currentCycle <= 10; currentCycle++) {
            boolean targetCycle = Objects.equals(currentCycle, cycle);
            List<String> cycleWarnings = targetCycle ? warnings : new ArrayList<>();
            List<AssignmentTask> tasks = assignmentTasks(semester, currentCycle, context.spaces(), cycleWarnings);
            for (AssignmentTask task : tasks) {
                int remaining = task.totalMinutes();
                while (remaining > 0) {
                    int chunk = Math.min(remaining, Math.min(MAX_CHUNK_MINUTES, context.durationMinutes(task.shift())));
                    PlacedSlot placedSlot = findSlot(task, chunk, context, placed);
                    if (placedSlot == null) {
                        if (targetCycle) {
                            warnings.add("No se pudo ubicar " + task.course().getCode()
                                    + " (" + task.shiftLabel() + ") sin conflictos.");
                        }
                        break;
                    }
                    placed.add(placedSlot);
                    if (targetCycle) {
                        preview.add(toEntity(semester, cycle, task, placedSlot, context.fingerprint()));
                    }
                    remaining -= chunk;
                }
            }
        }

        return preview;
    }

    private PlacedSlot findSlot(
            AssignmentTask task,
            int durationMinutes,
            ScheduleContext context,
            List<PlacedSlot> placed) {
        ShiftWindow window = context.window(task.shift());
        List<ScheduleWeekday> candidateDays = task.weekday() == null ? WEEKDAYS : List.of(task.weekday());
        for (ScheduleWeekday weekday : candidateDays) {
            LocalTime cursor = window.start();
            while (!cursor.plusMinutes(durationMinutes).isAfter(window.end())) {
                PlacedSlot candidate = new PlacedSlot(
                        task.course().getId(),
                        task.teacher().getId(),
                        task.space() == null ? null : task.space().getId(),
                        task.cycle(),
                        task.subShift(),
                        task.assignmentId(),
                        task.weekday() == null,
                        weekday,
                        cursor,
                        cursor.plusMinutes(durationMinutes));
                if (placed.stream().noneMatch(existing -> conflicts(existing, candidate))) {
                    return candidate;
                }
                cursor = cursor.plusMinutes(STEP_MINUTES);
            }
        }
        return null;
    }

    private boolean conflicts(PlacedSlot left, PlacedSlot right) {
        if (left.weekday() != right.weekday() || !overlaps(left.start(), left.end(), right.start(), right.end())) {
            return false;
        }
        if (canShareSubShiftSlot(left, right)) {
            return false;
        }
        if (Objects.equals(left.teacherId(), right.teacherId())) {
            return true;
        }
        if (left.spaceId() != null && Objects.equals(left.spaceId(), right.spaceId())) {
            return true;
        }
        return Objects.equals(left.cycle(), right.cycle())
                && subShiftConflicts(left.subShift(), right.subShift());
    }

    private boolean canShareSubShiftSlot(PlacedSlot left, PlacedSlot right) {
        return Objects.equals(left.courseId(), right.courseId())
                && Objects.equals(left.cycle(), right.cycle())
                && left.subShift() != null
                && right.subShift() != null
                && left.subShift() != right.subShift();
    }

    private boolean subShiftConflicts(SubShift left, SubShift right) {
        return left == null || right == null || left == right;
    }

    private boolean overlaps(LocalTime leftStart, LocalTime leftEnd, LocalTime rightStart, LocalTime rightEnd) {
        return leftStart.isBefore(rightEnd) && rightStart.isBefore(leftEnd);
    }

    private List<AssignmentTask> assignmentTasks(
            String semester,
            Integer cycle,
            List<Space> spaces,
            List<String> warnings) {
        List<Course> courses = courseRepository.findByFilters(semester, null, cycle);
        List<AssignmentTask> tasks = new ArrayList<>();
        for (Course course : courses) {
            int academicHours = academicHours(course);
            if (course.getTeacherAssignments().isEmpty()) {
                warnings.add("Curso sin docente asignado: " + course.getCode());
                continue;
            }
            for (CourseTeacherAssignment assignment : course.getTeacherAssignments()) {
                if (assignment.getTeacher() == null) {
                    warnings.add("Asignación sin docente: " + course.getCode());
                    continue;
                }
                Space space = resolveSpace(course, assignment, spaces, semester);
                if (space == null) {
                    warnings.add("Curso sin ambiente asignado: " + course.getCode() + " " + shiftLabel(assignment));
                }
                tasks.add(new AssignmentTask(
                        assignment.getId(),
                        course,
                        assignment.getTeacher(),
                        space,
                        course.getCycle(),
                        assignment.getShift(),
                        assignment.getSubShift(),
                        assignment.getWeekday(),
                        academicHours * ACADEMIC_MINUTES));
            }
        }
        addManualDayWarnings(tasks, warnings);
        tasks.sort(Comparator
                .comparing((AssignmentTask task) -> task.subShift() == null ? 0 : 1)
                .thenComparing(task -> task.shift().ordinal())
                .thenComparing(task -> task.course().getCode())
                .thenComparing(task -> task.subShift() == null ? "" : task.subShift().name()));
        return tasks;
    }

    private void addManualDayWarnings(List<AssignmentTask> tasks, List<String> warnings) {
        for (int leftIndex = 0; leftIndex < tasks.size(); leftIndex += 1) {
            AssignmentTask left = tasks.get(leftIndex);
            if (left.weekday() == null) {
                continue;
            }
            for (int rightIndex = leftIndex + 1; rightIndex < tasks.size(); rightIndex += 1) {
                AssignmentTask right = tasks.get(rightIndex);
                if (right.weekday() == null
                        || left.weekday() != right.weekday()
                        || left.shift() != right.shift()
                        || !Objects.equals(left.cycle(), right.cycle())
                        || Objects.equals(left.course().getId(), right.course().getId())) {
                    continue;
                }
                warnings.add("Día ocupado: " + left.course().getCode()
                        + " y " + right.course().getCode()
                        + " comparten " + left.weekday()
                        + " en el mismo ciclo y turno. Recomendado: mover uno a otro día.");
            }
        }
    }

    private Space resolveSpace(
            Course course,
            CourseTeacherAssignment assignment,
            List<Space> spaces,
            String semester) {
        for (Space space : spaces) {
            for (SpaceAssignment spaceAssignment : space.getAssignments()) {
                if (semester.equals(spaceAssignment.getSemester())
                        && sameCourseName(course, spaceAssignment.getCourseName())
                        && Objects.equals(course.getCycle(), spaceAssignment.getCycle())
                        && assignment.getShift() == spaceAssignment.getShift()
                        && assignment.getSubShift() == spaceAssignment.getSubShift()) {
                    return space;
                }
            }
        }
        return course.getSpaceAssignments().stream()
                .map(CourseSpaceAssignment::getSpace)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    private boolean sameCourseName(Course course, String courseName) {
        return courseName != null && course.getName().trim().equalsIgnoreCase(courseName.trim());
    }

    private ScheduleSlot toEntity(
            String semester,
            Integer cycle,
            AssignmentTask task,
            PlacedSlot placedSlot,
            String fingerprint) {
        ScheduleSlot slot = new ScheduleSlot();
        slot.setSemester(semester);
        slot.setCycle(cycle);
        slot.setCourse(task.course());
        slot.setTeacher(task.teacher());
        slot.setSpace(task.space());
        slot.setShift(task.shift());
        slot.setSubShift(task.subShift());
        slot.setAssignmentId(task.assignmentId());
        slot.setAutomaticWeekday(placedSlot.automaticWeekday());
        slot.setWeekday(placedSlot.weekday());
        slot.setStartTime(placedSlot.start());
        slot.setEndTime(placedSlot.end());
        slot.setSettingsFingerprint(fingerprint);
        return slot;
    }

    private ScheduleContext loadContext(String semester) {
        Map<String, ShiftWindow> windows = new LinkedHashMap<>();
        List<ScheduleBlockSetting> settings = scheduleBlockSettingRepository.findBySemester(semester);
        for (ScheduleBlockSetting setting : settings) {
            if ("MANANA".equals(setting.getBlockId())
                    || "TARDE".equals(setting.getBlockId())
                    || "NOCHE".equals(setting.getBlockId())) {
                windows.put(setting.getBlockId(), new ShiftWindow(setting.getStartTime(), setting.getEndTime()));
            }
        }
        for (String required : List.of("MANANA", "TARDE", "NOCHE")) {
            if (!windows.containsKey(required)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Faltan reglas de horario para " + required + " en el semestre " + semester);
            }
        }
        return new ScheduleContext(windows, fingerprint(settings), spaceRepository.findAll());
    }

    private String fingerprint(List<ScheduleBlockSetting> settings) {
        StringBuilder builder = new StringBuilder();
        settings.stream()
                .sorted(Comparator.comparing(ScheduleBlockSetting::getStartTime))
                .forEach(setting -> builder.append(setting.getBlockId())
                        .append('=')
                        .append(setting.getLabel())
                        .append('@')
                        .append(setting.getStartTime())
                        .append('-')
                        .append(setting.getEndTime())
                        .append(';'));
        return builder.toString();
    }

    private int academicHours(Course course) {
        Integer hours = COURSE_HOURS_BY_CODE.get(course.getCode());
        if (hours != null) {
            return hours;
        }
        return 4;
    }

    private String shiftLabel(CourseTeacherAssignment assignment) {
        return assignment.getSubShift() == null
                ? assignment.getShift().name()
                : assignment.getShift().name() + " " + assignment.getSubShift().name();
    }

    private void validateCycle(Integer cycle) {
        if (cycle == null || cycle < 1 || cycle > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ciclo inválido");
        }
    }

    private static final Map<String, Integer> COURSE_HOURS_BY_CODE = buildCourseHours();

    private static Map<String, Integer> buildCourseHours() {
        Map<String, Integer> hours = new LinkedHashMap<>();
        hours.put("ISEG240101", 6);
        hours.put("ISEG240102", 6);
        hours.put("ISEG240103", 6);
        hours.put("ISEG240104", 4);
        hours.put("ISEG240201", 5);
        hours.put("ISEG240202", 6);
        hours.put("ISEG240203", 4);
        hours.put("ISEG240301", 4);
        hours.put("ISEG240302", 4);
        hours.put("ISEG240303", 6);
        hours.put("ISEG240401", 4);
        hours.put("ISEG240402", 4);
        hours.put("ISEE240105", 4);
        hours.put("ISEE240204", 5);
        hours.put("ISEE240304", 7);
        hours.put("ISEE240305", 4);
        hours.put("ISEE240403", 4);
        hours.put("ISEE240404", 4);
        hours.put("ISEE240501", 4);
        hours.put("ISEE240701", 4);
        hours.put("ISEE240801", 4);
        hours.put("ISEE240901", 4);
        hours.put("ISEE240902", 6);
        hours.put("ISEE241001", 4);
        hours.put("ISEE241002", 6);
        hours.put("ISES240106", 6);
        hours.put("ISES240205", 6);
        hours.put("ISES240206", 6);
        hours.put("ISES240306", 6);
        hours.put("ISES240405", 5);
        hours.put("ISES240406", 5);
        hours.put("ISES240407", 6);
        hours.put("ISES240502", 4);
        hours.put("ISES240503", 6);
        hours.put("ISES240504", 6);
        hours.put("ISES240505", 6);
        hours.put("ISES240506", 4);
        hours.put("ISES240507", 4);
        hours.put("ISES240601", 6);
        hours.put("ISES240602", 4);
        hours.put("ISES240603", 6);
        hours.put("ISES240604", 6);
        hours.put("ISES240605", 6);
        hours.put("ISES240606", 6);
        hours.put("ISES240702", 6);
        hours.put("ISES240703", 6);
        hours.put("ISES240704", 6);
        hours.put("ISES240705", 6);
        hours.put("ISES240706", 6);
        hours.put("ISES240802", 6);
        hours.put("ISES240803", 6);
        hours.put("ISES240804", 6);
        hours.put("ISES240805", 6);
        hours.put("ISES240806", 6);
        hours.put("ISES240903", 6);
        hours.put("ISES240904", 6);
        hours.put("ISES240905", 6);
        hours.put("ISES241003", 6);
        hours.put("ISES241004", 6);
        hours.put("ISES241005", 5);
        hours.put("IS-ELECTIVO-I", 4);
        hours.put("IS-ELECTIVO-II", 4);
        return Map.copyOf(hours);
    }

    private record ShiftWindow(LocalTime start, LocalTime end) {
    }

    private record ScheduleContext(
            Map<String, ShiftWindow> windows,
            String fingerprint,
            List<Space> spaces) {

        ShiftWindow window(TeacherShift shift) {
            return windows.get(blockId(shift));
        }

        int durationMinutes(TeacherShift shift) {
            ShiftWindow window = window(shift);
            return (int) Duration.between(window.start(), window.end()).toMinutes();
        }

        private String blockId(TeacherShift shift) {
            return switch (shift) {
                case MANANA -> "MANANA";
                case TARDE -> "TARDE";
                case NOCHE -> "NOCHE";
            };
        }
    }

    private record AssignmentTask(
            Long assignmentId,
            Course course,
            Teacher teacher,
            Space space,
            Integer cycle,
            TeacherShift shift,
            SubShift subShift,
            ScheduleWeekday weekday,
            int totalMinutes) {

        String shiftLabel() {
            return subShift == null ? shift.name() : shift.name() + " " + subShift.name();
        }
    }

    private record PlacedSlot(
            Long courseId,
            Long teacherId,
            Long spaceId,
            Integer cycle,
            SubShift subShift,
            Long assignmentId,
            boolean automaticWeekday,
            ScheduleWeekday weekday,
            LocalTime start,
            LocalTime end) {

        static PlacedSlot from(ScheduleSlot slot) {
            return new PlacedSlot(
                    slot.getCourse().getId(),
                    slot.getTeacher().getId(),
                    slot.getSpace() == null ? null : slot.getSpace().getId(),
                    slot.getCycle(),
                    slot.getSubShift(),
                    slot.getAssignmentId(),
                    slot.isAutomaticWeekday(),
                    slot.getWeekday(),
                    slot.getStartTime(),
                    slot.getEndTime());
        }
    }
}
