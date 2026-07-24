package com.example.schedule.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule.entity.User;
import com.example.schedule.model.Role;

@Service
public class CurrentUserService {

    public User getCurrentUserOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }
        return principal.getUser();
    }

    public Role getCurrentRole() {
        User user = getCurrentUserOrNull();
        return user == null ? null : user.getRole();
    }

    public Integer getAssignedCycle() {
        User user = getCurrentUserOrNull();
        return user == null ? null : user.getAssignedCycle();
    }

    public Integer requireAssignedCycleForStudent() {
        if (!isStudent()) {
            return null;
        }
        Integer cycle = getAssignedCycle();
        if (cycle == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "El estudiante no tiene un ciclo asignado.");
        }
        return cycle;
    }

    public boolean isOwner() {
        return getCurrentRole() == Role.OWNER;
    }

    public boolean isAdmin() {
        return getCurrentRole() == Role.ADMIN;
    }

    public boolean canManageAcademic() {
        return isOwner() || isAdmin();
    }

    public boolean canManageUsers() {
        return isOwner() || isAdmin();
    }

    public boolean isStudent() {
        return getCurrentRole() == Role.ESTUDIANTE;
    }
}
