package com.project.controller;

import com.project.dto.NavigationEmailRequest;
import com.project.service.MailService;
import com.project.service.NavigationTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class NavigationEmailController {

    private final NavigationTokenService tokenService;
    private final MailService mailService;

    @PostMapping("/send-navigation-link")
    public ResponseEntity<?> sendNavigationLink(@Valid @RequestBody NavigationEmailRequest request) {
        try {
            // Generate token
            String token = tokenService.generateNavigationToken(
                    request.getEmail(),
                    request.getBuildingId(),
                    request.getDestination(),
                    request.getStart()
            );

            // Construct frontend link (Assuming React runs on localhost:5173 for local, update to production URL later)
            String navigationLink = "http://localhost:5173/smart-navigation?token=" + token;

            // Send Email
            mailService.sendNavigationEmail(request.getEmail(), navigationLink);

            return ResponseEntity.ok().body("{\"message\": \"Navigation link sent successfully to " + request.getEmail() + "\"}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("{\"error\": \"Failed to send email: " + e.getMessage() + "\"}");
        }
    }
}
