package com.project.graph;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents an edge (connection) between two nodes in the indoor navigation graph.
 * Contains distance, traversal type, and accessibility information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Edge {
    /** Source node identifier */
    private Long sourceId;
    /** Destination node identifier */
    private Long targetId;
    /** Weight for A* (e.g., Euclidean distance) */
    private double weight;
    /** Traversal type (e.g., "STAIRS", "ELEVATOR", "CORRIDOR") */
    private String traversalType;
    /** Whether the edge is accessible for wheelchair users */
    private boolean accessible;
    /** Estimated walk time in seconds for this edge */
    private int estimatedWalkTime;
}
