package com.example.schedule.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePracticeHeadRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @Size(max = 20) String semester,
        @Size(max = 150) String email,
        @Size(max = 30) String phone,
        @Valid List<PracticeHeadLabAssignmentRequest> labAssignments
) {
}
