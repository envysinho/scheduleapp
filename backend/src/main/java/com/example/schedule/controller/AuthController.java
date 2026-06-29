package com.example.schedule.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schedule.dto.LoginRequest;
import com.example.schedule.dto.LoginResponse;
import com.example.schedule.dto.UserResponse;
import com.example.schedule.entity.User;
import com.example.schedule.security.JwtService;
import com.example.schedule.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userService.authenticate(request.username(), request.password());
        String token = jwtService.generateToken(user.getUsername());
        return ResponseEntity.ok(new LoginResponse(UserResponse.from(user), token));
    }
}
