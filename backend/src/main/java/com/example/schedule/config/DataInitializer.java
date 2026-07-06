package com.example.schedule.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.example.schedule.service.CourseService;
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
    private final ScheduleSettingsService scheduleSettingsService;

    public DataInitializer(
            UserService userService,
            TeacherService teacherService,
            SpaceService spaceService,
            CourseService courseService,
            ScheduleSettingsService scheduleSettingsService) {
        this.userService = userService;
        this.teacherService = teacherService;
        this.spaceService = spaceService;
        this.courseService = courseService;
        this.scheduleSettingsService = scheduleSettingsService;
    }

    @Override
    public void run(ApplicationArguments args) {
        userService.seedAdminIfMissing("admin", "admin123");
        scheduleSettingsService.seedDefaultsIfEmpty();
        teacherService.migrateEmploymentTypesIfNeeded();
        teacherService.migrateLegacyShiftsIfNeeded();
        spaceService.seedDemoIfEmpty();
        courseService.migrateLectivosIfNeeded();
        courseService.migrateCourseCodesIfNeeded();
        courseService.seedFromPlanIfEmpty();
    }
}
