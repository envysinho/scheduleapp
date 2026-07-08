package com.example.schedule.dto;

import com.example.schedule.model.Role;

import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(min = 3, max = 50) String username,
        @Size(max = 60) String firstName,
        @Size(max = 60) String lastName,
        @Size(min = 6, max = 100) String password,
        Role role,
        Boolean enabled
) {
}
