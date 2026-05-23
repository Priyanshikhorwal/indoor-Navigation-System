package com.project.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "edges")
public class Edge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_node_id", nullable = false)
    private Node sourceNode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_node_id", nullable = false)
    private Node destinationNode;

    @Column(nullable = false)
    private Double distance; // Euclidean weight or penalty

    @Column(name = "is_accessible", nullable = false)
    private Boolean isAccessible = true;

    @Column(name = "is_bidirectional", nullable = false)
    private Boolean isBidirectional = true;
}
