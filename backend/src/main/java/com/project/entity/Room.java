package com.project.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Room name is mandatory")
    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @NotBlank(message = "Room type is mandatory")
    @Column(nullable = false)
    private String type = "ROOM"; // ROOM, LAB, CORRIDOR, STAIRS, LIFT, ENTRY_EXIT, OFFICE

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "floor_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Floor floor;
}
