package com.example.schedule.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.example.schedule.service.CourseService;
import com.example.schedule.service.SpaceService;
import com.example.schedule.service.TeacherService;
import com.example.schedule.service.UserService;

@Component
public class DataInitializer implements ApplicationRunner {

    private final UserService userService;
    private final TeacherService teacherService;
    private final SpaceService spaceService;
    private final CourseService courseService;

    public DataInitializer(
            UserService userService,
            TeacherService teacherService,
            SpaceService spaceService,
            CourseService courseService) {
        this.userService = userService;
        this.teacherService = teacherService;
        this.spaceService = spaceService;
        this.courseService = courseService;
    }

    @Override
    public void run(ApplicationArguments args) {
        userService.seedAdminIfMissing("admin", "admin123");
        teacherService.migrateEmploymentTypesIfNeeded();
        teacherService.seedDemoIfEmpty();
        teacherService.migrateLegacyShiftsIfNeeded();
        spaceService.seedDemoIfEmpty();
        courseService.migrateLectivosIfNeeded();
        courseService.seedFromPlanIfEmpty();
    }
}
