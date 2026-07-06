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

    public static boolean isLabSubShiftCycle(Integer cycle) {
        return cycle != null && (cycle == 8 || cycle == 9 || cycle == 10);
    }

    public static List<SubShift> allowedSubShiftsForLabCycle(Integer cycle, TeacherShift shift) {
        if (cycle == null || shift == null) {
            return List.of();
        }
        if (isNightOnlyCycle(cycle) && shift == TeacherShift.NOCHE) {
            return List.of(SubShift.NA1, SubShift.NA2, SubShift.NB1, SubShift.NB2);
        }
        if (isDayOnlyCycle(cycle)) {
            if (shift == TeacherShift.MANANA) {
                return List.of(SubShift.A1, SubShift.A2);
            }
            if (shift == TeacherShift.TARDE) {
                return List.of(SubShift.B1, SubShift.B2);
            }
        }
        return List.of();
    }
}
