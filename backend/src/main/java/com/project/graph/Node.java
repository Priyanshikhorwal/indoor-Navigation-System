package com.project.graph;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a node in the indoor navigation graph.
 * Each node corresponds to a Location (room, corridor, stair, etc.).
 * The {@code floorId} field enables multi‑floor routing.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Node {
    /** Unique identifier (matches Location.id) */
    private Long id;
    /** Human readable name, e.g., "Room 101" */
    private String name;
    /** X coordinate on the floor plan (pixels or scaled units) */
    private double x;
    /** Y coordinate on the floor plan */
    private double y;
    /** Z coordinate – the floor index (0 = ground floor, 1 = first floor, …) */
    private int floorId;
    /** Optional additional metadata */
    private String metadata;
}
