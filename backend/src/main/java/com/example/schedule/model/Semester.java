package com.example.schedule.model;

public final class Semester {

    public static final String CURRENT = "26-II";

    private Semester() {
    }

    public static String normalize(String semester) {
        if (semester == null || semester.isBlank()) {
            return CURRENT;
        }
        return semester.trim();
    }
}
