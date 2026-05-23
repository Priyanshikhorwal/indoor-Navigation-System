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
@Table(name = "floors")
public class Floor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "building_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Building building;

    @NotNull(message = "Floor number is mandatory")
    @Column(name = "floor_number", nullable = false)
    private Integer floorNumber;

    @NotBlank(message = "Floor name is mandatory")
    @Column(name = "floor_name", nullable = false)
    private String floorName;

    @Column(name = "map_image_url")
    private String mapImageUrl;

}
