package com.example.schedule.model;

import java.util.Set;

public final class CourseCycleRules {

    private static final Set<Integer> NIGHT_ONLY_CYCLES = Set.of(9, 10);

    private CourseCycleRules() {
    }

    public static boolean isNightOnlyCycle(Integer cycle) {
        return cycle != null && NIGHT_ONLY_CYCLES.contains(cycle);
    }
}
