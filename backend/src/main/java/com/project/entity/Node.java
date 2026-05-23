package com.project.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "nodes")
public class Node {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "X Coordinate is mandatory")
    @Column(name = "x_coordinate", nullable = false)
    private Integer xCoordinate;

    @NotNull(message = "Y Coordinate is mandatory")
    @Column(name = "y_coordinate", nullable = false)
    private Integer yCoordinate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "floor_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Floor floor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_id", nullable = true)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Room room; // Nullable room mapping
}
