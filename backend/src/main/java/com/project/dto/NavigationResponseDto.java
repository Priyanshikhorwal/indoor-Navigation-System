package com.project.dto;

import com.project.entity.Location;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NavigationResponseDto {
    private List<Location> path;
    private List<NavigationStepDto> instructions;
    private Double totalDistance;
}
