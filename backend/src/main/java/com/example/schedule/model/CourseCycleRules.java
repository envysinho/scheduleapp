package com.example.schedule.model;

import java.util.List;
import java.util.Set;

public final class CourseCycleRules {

    private static final Set<Integer> NIGHT_ONLY_CYCLES = Set.of(9, 10);

    private CourseCycleRules() {
    }

    public static boolean isNightOnlyCycle(Integer cycle) {
        return cycle != null && NIGHT_ONLY_CYCLES.contains(cycle);
    }

    public static boolean isDayOnlyCycle(Integer cycle) {
        return cycle != null && cycle >= 1 && cycle <= 8;
    }

    public static List<TeacherShift> allowedShiftsForCycle(Integer cycle) {
        if (isNightOnlyCycle(cycle)) {
            return List.of(TeacherShift.NOCHE);
        }
        if (isDayOnlyCycle(cycle)) {
            return List.of(TeacherShift.MANANA, TeacherShift.TARDE);
        }
        return List.of(TeacherShift.MANANA, TeacherShift.TARDE, TeacherShift.NOCHE);
    }
}
