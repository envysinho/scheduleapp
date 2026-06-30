package com.example.schedule.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.example.schedule.service.TeacherService;
import com.example.schedule.service.UserService;

@Component
public class DataInitializer implements ApplicationRunner {

    private final UserService userService;
    private final TeacherService teacherService;

    public DataInitializer(UserService userService, TeacherService teacherService) {
        this.userService = userService;
        this.teacherService = teacherService;
    }

    @Override
    public void run(ApplicationArguments args) {
        userService.seedAdminIfMissing("admin", "admin123");
        teacherService.seedDemoIfEmpty();
    }
}
