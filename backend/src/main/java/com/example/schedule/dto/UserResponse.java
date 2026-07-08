package com.example.schedule.dto;

import com.example.schedule.entity.User;
import com.example.schedule.model.Role;

public record UserResponse(
        Long id,
        String username,
        String firstName,
        String lastName,
        Role role,
        boolean enabled
) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.isEnabled());
    }
}
