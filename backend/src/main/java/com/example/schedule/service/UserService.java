package com.example.schedule.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.schedule.dto.CreateUserRequest;
import com.example.schedule.dto.UpdateUserRequest;
import com.example.schedule.dto.UserResponse;
import com.example.schedule.entity.User;
import com.example.schedule.model.Role;
import com.example.schedule.repository.UserRepository;
import com.example.schedule.security.CurrentUserService;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;
    private final CurrentUserService currentUserService;
    private final NotificationService notificationService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate,
            CurrentUserService currentUserService,
            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
        this.currentUserService = currentUserService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return visibleUsers().stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        User user = getUserOrThrow(id);
        ensureCanManageUser(user, user.getRole());
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public User authenticate(String username, String password) {
        User user = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));

        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario desactivado");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
        }

        return user;
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        String username = request.username().trim();

        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El usuario ya existe");
        }

        User user = new User();
        user.setUsername(username);
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        Role role = request.role() != null ? request.role() : Role.DOCENTE;
        ensureCanAssignRole(role);
        user.setRole(role);
        user.setAssignedCycle(normalizeAssignedCycle(role, request.assignedCycle()));
        user.setEnabled(true);

        User saved = userRepository.save(user);
        notificationService.record("creó al usuario " + displayName(saved));
        return UserResponse.from(saved);
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = getUserOrThrow(id);

        if (request.username() != null) {
            String username = request.username().trim();
            if (userRepository.existsByUsernameAndIdNot(username, id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "El usuario ya existe");
            }
            user.setUsername(username);
        }

        if (request.firstName() != null) {
            user.setFirstName(request.firstName().trim());
        }

        if (request.lastName() != null) {
            user.setLastName(request.lastName().trim());
        }

        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        Role nextRole = request.role() != null ? request.role() : user.getRole();
        ensureCanManageUser(user, nextRole);

        if (request.role() != null) {
            if (user.getRole() == Role.OWNER
                    && request.role() != Role.OWNER
                    && userRepository.countByRole(Role.OWNER) <= 1) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "No se puede cambiar el rol del último owner");
            }
            user.setRole(request.role());
        }
        user.setAssignedCycle(normalizeAssignedCycle(nextRole, request.assignedCycle()));

        if (request.enabled() != null) {
            if (!request.enabled()
                    && user.getRole() == Role.OWNER
                    && userRepository.countByRole(Role.OWNER) <= 1) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "No se puede desactivar el último owner");
            }
            user.setEnabled(request.enabled());
        }

        User saved = userRepository.save(user);
        notificationService.record("actualizó al usuario " + displayName(saved));
        return UserResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        User user = getUserOrThrow(id);
        ensureCanManageUser(user, user.getRole());

        if (user.getRole() == Role.OWNER && userRepository.countByRole(Role.OWNER) <= 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "No se puede eliminar el último owner");
        }

        String deletedName = displayName(user);
        userRepository.delete(user);
        notificationService.record("eliminó al usuario " + deletedName);
    }

    @Transactional
    public UserResponse setEnabled(Long id, boolean enabled) {
        User user = getUserOrThrow(id);
        ensureCanManageUser(user, user.getRole());

        if (!enabled && user.getRole() == Role.OWNER && userRepository.countByRole(Role.OWNER) <= 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "No se puede desactivar el último owner");
        }

        user.setEnabled(enabled);
        User saved = userRepository.save(user);
        notificationService.record((enabled ? "activó" : "desactivó") + " al usuario " + displayName(saved));
        return UserResponse.from(saved);
    }

    @Transactional
    public void seedDefaultUsersIfMissing() {
        seedUserIfMissing("owner", "Owner", "Sistema", "owner123", Role.OWNER, null);
        seedUserIfMissing("admin", "Admin", "Sistema", "admin123", Role.ADMIN, null);
        seedUserIfMissing("docente", "Docente", "Demo", "docente123", Role.DOCENTE, null);
        seedUserIfMissing("estudiante", "Estudiante", "Demo", "estudiante123", Role.ESTUDIANTE, 1);
    }

    @Transactional
    public void migrateRolesIfNeeded() {
        try {
            jdbcTemplate.execute("""
                    ALTER TABLE users
                    ADD COLUMN IF NOT EXISTS assigned_cycle INTEGER
                    """);
        } catch (Exception ignored) {
        }
        try {
            jdbcTemplate.execute("""
                    ALTER TABLE users
                    DROP CONSTRAINT IF EXISTS users_role_check
                    """);
        } catch (Exception ignored) {
        }
        try {
            jdbcTemplate.execute("""
                    UPDATE users
                    SET role = CASE
                        WHEN role = 'ADMIN' THEN 'OWNER'
                        WHEN role = 'USER' OR role IS NULL OR BTRIM(role) = '' THEN 'DOCENTE'
                        WHEN role IN ('OWNER', 'DOCENTE', 'ESTUDIANTE') THEN role
                        ELSE 'DOCENTE'
                    END
                    WHERE role IS DISTINCT FROM CASE
                        WHEN role = 'ADMIN' THEN 'OWNER'
                        WHEN role = 'USER' OR role IS NULL OR BTRIM(role) = '' THEN 'DOCENTE'
                        WHEN role IN ('OWNER', 'DOCENTE', 'ESTUDIANTE') THEN role
                        ELSE 'DOCENTE'
                    END
                    """);
        } catch (Exception ignored) {
        }
        try {
            jdbcTemplate.execute("""
                    ALTER TABLE users
                    ADD CONSTRAINT users_role_check
                    CHECK (role IN ('OWNER', 'ADMIN', 'DOCENTE', 'ESTUDIANTE'))
                    """);
        } catch (Exception ignored) {
        }
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private String displayName(User user) {
        String fullName = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return fullName.isBlank() ? user.getUsername() : fullName;
    }

    private List<User> visibleUsers() {
        if (currentUserService.isOwner()) {
            return userRepository.findAll();
        }
        if (currentUserService.isAdmin()) {
            return userRepository.findAll().stream()
                    .filter(user -> !isAdminLevelRole(user.getRole()))
                    .toList();
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para ver usuarios");
    }

    private void ensureCanAssignRole(Role role) {
        if (currentUserService.isOwner()) {
            return;
        }
        if (currentUserService.isAdmin() && !isAdminLevelRole(role)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para asignar ese rol");
    }

    private void ensureCanManageUser(User target, Role nextRole) {
        if (currentUserService.isOwner()) {
            return;
        }
        if (currentUserService.isAdmin() && !isAdminLevelRole(target.getRole()) && !isAdminLevelRole(nextRole)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para gestionar este usuario");
    }

    private Integer normalizeAssignedCycle(Role role, Integer assignedCycle) {
        if (role != Role.ESTUDIANTE) {
            return null;
        }
        if (assignedCycle == null || assignedCycle < 1 || assignedCycle > 10) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los estudiantes deben tener un ciclo válido entre 1 y 10.");
        }
        return assignedCycle;
    }

    private boolean isAdminLevelRole(Role role) {
        return role == Role.OWNER || role == Role.ADMIN;
    }

    private void seedUserIfMissing(
            String username,
            String firstName,
            String lastName,
            String password,
            Role role,
            Integer assignedCycle) {
        if (userRepository.findByUsername(username).isPresent()) {
            return;
        }

        User user = new User();
        user.setUsername(username);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setAssignedCycle(normalizeAssignedCycle(role, assignedCycle));
        user.setEnabled(true);
        userRepository.save(user);
    }
}
