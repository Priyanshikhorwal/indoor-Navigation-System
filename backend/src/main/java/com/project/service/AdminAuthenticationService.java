package com.project.service;

import com.project.entity.User;
import com.project.exception.UnauthorizedAdminException;
import com.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service responsible for enforcing the single-admin authentication policy.
 * Only the configured admin email is ever permitted to hold ROLE_ADMIN.
 */
@Service
@RequiredArgsConstructor
public class AdminAuthenticationService {

    @Value("${admin.email}")
    private String adminEmail;

    private final UserRepository userRepository;

    /**
     * Returns true if the given email matches the one and only admin email (case-insensitive).
     */
    public boolean isAdminEmail(String email) {
        return email != null && adminEmail.equalsIgnoreCase(email.trim());
    }

    /**
     * Retrieves the admin User entity from the database.
     * Throws UnauthorizedAdminException if the admin account is missing (should never happen after init).
     */
    public User getAdminUser() {
        return userRepository.findByEmail(adminEmail)
                .filter(u -> "ROLE_ADMIN".equals(u.getRole()))
                .orElseThrow(UnauthorizedAdminException::new);
    }
}
