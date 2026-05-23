package com.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NavigationTokenResponse {
    private boolean valid;
    private Long buildingId;
    private String start;
    private String destination;
    private Long startNodeId;
    private Long destinationNodeId;
    private String error;
}
