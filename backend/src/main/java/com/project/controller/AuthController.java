package com.project.controller;

import com.project.dto.AuthResponse;
import com.project.dto.LoginRequest;
import com.project.entity.User;
import com.project.repository.UserRepository;
import com.project.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final jakarta.servlet.http.HttpServletRequest httpServletRequest;

    @org.springframework.beans.factory.annotation.Value("${admin.registration.secret:super-secret-admin-token-123}")
    private String adminRegistrationSecret;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        final String token = jwtUtil.generateToken(userDetails);
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getRole()));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody LoginRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }

        String rawRole = request.getRole();
        String role = "ROLE_USER";
        if (rawRole != null && !rawRole.trim().isEmpty()) {
            String cleanRole = rawRole.trim().toUpperCase();
            if (!cleanRole.startsWith("ROLE_")) {
                role = "ROLE_" + cleanRole;
            } else {
                role = cleanRole;
            }
        }

        if ("ROLE_ADMIN".equals(role)) {
            if (userRepository.existsByRole("ROLE_ADMIN")) {
                String secretHeader = httpServletRequest.getHeader("X-Admin-Secret");
                if (!adminRegistrationSecret.equals(secretHeader)) {
                    throw new RuntimeException("Administrator registration is protected. Invalid registration secret.");
                }
            }
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        userRepository.save(user);

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        final String token = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getRole()));
    }
}
