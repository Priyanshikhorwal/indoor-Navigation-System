package com.project.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NavigationEmailRequest {
    @NotBlank(message = "Email is mandatory")
    @Email(message = "Valid email is required")
    private String email;

    @NotNull(message = "Building ID is mandatory")
    private Long buildingId;

    @NotNull(message = "Destination node ID is mandatory")
    private Long destination;

    private Long start; // Optional start node if known, else defaults to building entrance
}
