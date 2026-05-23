package com.project.controller;

import com.project.dto.AuthResponse;
import com.project.dto.LoginRequest;
import com.project.entity.User;
import com.project.exception.UnauthorizedAdminException;
import com.project.repository.UserRepository;
import com.project.security.JwtUtil;
import com.project.service.AdminAuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminAuthenticationService adminAuthService;

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN LOGIN — dedicated endpoint, only the one fixed admin is accepted
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Dedicated admin login endpoint.
     * Only accepts the single fixed admin email defined in application.properties.
     * Any other email or wrong password returns 403 "Unauthorized Admin Access".
     */
    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody LoginRequest request) {

        // Reject immediately if the email is not the fixed admin email
        if (!adminAuthService.isAdminEmail(request.getEmail())) {
            throw new UnauthorizedAdminException();
        }

        // Attempt authentication — wrong password also results in 403
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new UnauthorizedAdminException();
        } catch (Exception e) {
            throw new UnauthorizedAdminException();
        }

        // Load admin user and double-check role
        User admin = adminAuthService.getAdminUser();
        if (!"ROLE_ADMIN".equals(admin.getRole())) {
            throw new UnauthorizedAdminException();
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(admin.getEmail());
        final String token = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(token, admin.getEmail(), admin.getRole()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USER LOGIN — standard users only; admin email blocked here
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Standard user login.
     * Admin email is intentionally blocked here — use /admin/login instead.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {

        // Block the admin from using the user login portal
        if (adminAuthService.isAdminEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Administrator must use the Admin Login portal."));
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password."));
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        final String token = jwtUtil.generateToken(userDetails);
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getRole()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USER REGISTRATION — ROLE_USER only; ROLE_ADMIN permanently blocked
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * User self-registration.
     * Admin registration is permanently disabled — no exceptions, no secret headers.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody LoginRequest request) {

        // Block registration of the admin email
        if (adminAuthService.isAdminEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin registration is permanently disabled."));
        }

        // Block any attempt to self-assign ROLE_ADMIN regardless of how it is formatted
        String rawRole = request.getRole();
        if (rawRole != null) {
            String normalised = rawRole.trim().toUpperCase();
            if (normalised.contains("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Admin registration is permanently disabled."));
            }
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email is already in use."));
        }

        // Always create as ROLE_USER — the role field from the request is ignored for safety
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_USER")
                .build();

        userRepository.save(user);

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        final String token = jwtUtil.generateToken(userDetails);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(token, user.getEmail(), user.getRole()));
    }
}
