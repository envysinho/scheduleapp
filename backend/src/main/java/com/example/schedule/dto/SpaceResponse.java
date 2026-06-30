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
        return new SpaceResponse(
                space.getId(),
                space.getName(),
                space.getSpaceType(),
                space.getAvailability(),
                space.getManagerName(),
                space.getManagerPhone(),
                space.getAssignments().stream()
                        .map(SpaceAssignmentResponse::from)
                        .toList());
    }
}
