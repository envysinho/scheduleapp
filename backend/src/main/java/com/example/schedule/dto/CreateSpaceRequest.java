package com.example.schedule.dto;

import java.util.List;

import com.example.schedule.model.SpaceAvailability;
import com.example.schedule.model.SpaceType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSpaceRequest(
        @NotBlank @Size(max = 150) String name,
        @NotNull SpaceType spaceType,
        @NotNull SpaceAvailability availability,
        @NotBlank @Size(max = 150) String managerName,
        @Size(max = 30) String managerPhone,
        @NotEmpty @Valid List<SpaceAssignmentRequest> assignments
) {
}
