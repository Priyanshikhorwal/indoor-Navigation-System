package com.project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NavigationStepDto {
    private String instruction;
    private String action; // WALK_STRAIGHT, TURN_LEFT, TURN_RIGHT, TAKE_STAIRS, TAKE_ELEVATOR, ARRIVE
    private Double distance;
    private String floor;
}
