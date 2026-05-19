package com.project.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PathConnectionDto {

    @NotNull(message = "Source location ID is mandatory")
    private Long sourceLocationId;

    @NotNull(message = "Destination location ID is mandatory")
    private Long destinationLocationId;

    private Double distance; // Optional. If null, we calculate it

    private Boolean isAccessible = true; // Default to true
}
