package com.example.schedule.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.example.schedule.service.CourseService;
import com.example.schedule.service.PracticeHeadService;
import com.example.schedule.service.ScheduleService;
import com.example.schedule.service.ScheduleSettingsService;
import com.example.schedule.service.SpaceService;
import com.example.schedule.service.TeacherService;
import com.example.schedule.service.UserService;

@Component
public class DataInitializer implements ApplicationRunner {

    private final UserService userService;
    private final TeacherService teacherService;
    private final SpaceService spaceService;
    private final CourseService courseService;
    private final PracticeHeadService practiceHeadService;
    private final ScheduleService scheduleService;
    private final ScheduleSettingsService scheduleSettingsService;

    public DataInitializer(
            UserService userService,
            TeacherService teacherService,
            SpaceService spaceService,
            CourseService courseService,
            PracticeHeadService practiceHeadService,
            ScheduleService scheduleService,
            ScheduleSettingsService scheduleSettingsService) {
        this.userService = userService;
        this.teacherService = teacherService;
        this.spaceService = spaceService;
        this.courseService = courseService;
        this.practiceHeadService = practiceHeadService;
        this.scheduleService = scheduleService;
        this.scheduleSettingsService = scheduleSettingsService;
    }

    @Override
    public void run(ApplicationArguments args) {
        userService.migrateRolesIfNeeded();
        userService.seedDefaultUsersIfMissing();
        scheduleSettingsService.seedDefaultsIfEmpty();
        teacherService.migrateEmploymentTypesIfNeeded();
        teacherService.migrateLegacyShiftsIfNeeded();
        teacherService.migrateSubShiftConstraintIfNeeded();
        teacherService.migrateAssignmentScheduleIfNeeded();
        practiceHeadService.migrateSemestersIfNeeded();
        spaceService.migrateAssignmentSemestersIfNeeded();
        spaceService.seedDemoIfEmpty();
        courseService.migrateLectivosIfNeeded();
        courseService.migrateCourseCodesIfNeeded();
        courseService.migrateRequiredSpaceTypeIfNeeded();
        courseService.seedFromPlanIfEmpty();
        teacherService.seedNombradosIfEmpty();
        scheduleSettingsService.seedDefaultsIfEmpty("26-X");
        courseService.seedFromPlanIfMissing("26-X");
        teacherService.seedNombradosIfEmpty("26-X");
        teacherService.seedRemainingTeachersForSemester("26-X");
        spaceService.seedAssignmentsForSemesterIfEmpty("26-X");
        scheduleService.refreshSchedulesForSemester("26-X");
    }
}
