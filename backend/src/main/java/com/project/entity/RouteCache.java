package com.project.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "routes_cache")
public class RouteCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sourceId;

    @Column(nullable = false)
    private Long destinationId;

    @Column(nullable = false)
    private Double totalDistance;

    private Integer estimatedTime;
    
    private Integer floorTransitionCount;

    @Column(columnDefinition = "TEXT")
    private String cachedRoute; // JSON string of the route
}
