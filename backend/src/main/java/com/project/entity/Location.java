package com.project.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "locations")
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is mandatory")
    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @NotNull(message = "X Coordinate is mandatory")
    @Column(nullable = false)
    private Integer xCoordinate;

    @NotNull(message = "Y Coordinate is mandatory")
    @Column(nullable = false)
    private Integer yCoordinate;
    
    private String floor;
}
