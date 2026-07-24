package com.example.schedule.dto;

import java.util.List;

import com.example.schedule.entity.Space;
import com.example.schedule.model.SpaceAvailability;
import com.example.schedule.model.SpaceType;

public record SpaceResponse(
        Long id,
        String name,
        SpaceType spaceType,
        SpaceAvailability availability,
        String managerName,
        String managerPhone,
        List<SpaceAssignmentResponse> assignments
) {

    public static SpaceResponse from(Space space) {
        return from(space, null, null);
    }

    public static SpaceResponse from(Space space, String semester) {
        return from(space, semester, null);
    }

    public static SpaceResponse from(Space space, String semester, Integer cycle) {
        return from(space, semester, cycle, space.getAvailability());
    }

    public static SpaceResponse from(
            Space space,
            String semester,
            Integer cycle,
            SpaceAvailability availability) {
        return new SpaceResponse(
                space.getId(),
                space.getName(),
                space.getSpaceType(),
                availability,
                space.getManagerName(),
                space.getManagerPhone(),
                space.getAssignments().stream()
                        .filter(assignment -> semester == null || semester.equals(assignment.getSemester()))
                        .filter(assignment -> cycle == null || cycle.equals(assignment.getCycle()))
                        .map(SpaceAssignmentResponse::from)
                        .toList());
    }
}
