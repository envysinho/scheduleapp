package com.example.schedule.dto;

import java.util.List;

import com.example.schedule.entity.PracticeHead;

public record PracticeHeadResponse(
        Long id,
        String firstName,
        String lastName,
        String fullName,
        String email,
        String phone,
        List<PracticeHeadLabAssignmentResponse> labAssignments
) {

    public static PracticeHeadResponse from(PracticeHead practiceHead) {
        return new PracticeHeadResponse(
                practiceHead.getId(),
                practiceHead.getFirstName(),
                practiceHead.getLastName(),
                practiceHead.getFirstName() + " " + practiceHead.getLastName(),
                practiceHead.getEmail(),
                practiceHead.getPhone(),
                practiceHead.getLabAssignments().stream()
                        .map(PracticeHeadLabAssignmentResponse::from)
                        .toList());
    }
}
