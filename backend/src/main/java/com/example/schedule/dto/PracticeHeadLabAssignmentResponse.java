package com.example.schedule.dto;

import com.example.schedule.entity.PracticeHeadLabAssignment;
import com.example.schedule.entity.Space;

public record PracticeHeadLabAssignmentResponse(
        Long id,
        Long spaceId,
        String spaceName
) {

    public static PracticeHeadLabAssignmentResponse from(PracticeHeadLabAssignment assignment) {
        Space space = assignment.getSpace();
        return new PracticeHeadLabAssignmentResponse(
                assignment.getId(),
                space.getId(),
                space.getName());
    }
}
