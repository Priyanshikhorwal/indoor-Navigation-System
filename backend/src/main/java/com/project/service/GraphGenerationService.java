package com.project.service;

import com.project.entity.Location;
import com.project.entity.PathConnection;
import com.project.graph.Node;
import com.project.graph.Edge;
import com.project.repository.LocationRepository;
import com.project.repository.PathConnectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GraphGenerationService {

    private final LocationRepository locationRepository;
    private final PathConnectionRepository pathConnectionRepository;
    private static final double FLOOR_HEIGHT = 3.0; // meters per floor for distance calculation

    /**
     * Build a graph where each node is a Location and edges are PathConnections.
     * Returns adjacency list: nodeId -> list of outgoing edges.
     */
    @Transactional(readOnly = true)
    public Map<Long, List<Edge>> generateGraph() {
        List<Location> locations = locationRepository.findAll();
        Map<Long, Node> nodeMap = locations.stream()
                .collect(Collectors.toMap(Location::getId, loc -> new Node(loc.getId(), loc.getXCoordinate(), loc.getYCoordinate(), loc.getFloor().getId())));
        List<PathConnection> connections = pathConnectionRepository.findAll();
        Map<Long, List<Edge>> adjacency = new HashMap<>();
        // initialise adjacency lists
        nodeMap.keySet().forEach(id -> adjacency.put(id, new ArrayList<>()));
        for (PathConnection pc : connections) {
            Node src = nodeMap.get(pc.getSourceLocation().getId());
            Node dst = nodeMap.get(pc.getDestinationLocation().getId());
            if (src == null || dst == null) continue; // safety
            double distance = calculateDistance(src, dst);
            Edge edge = new Edge(src.getId(), dst.getId(), distance, pc.isBidirectional(), pc.getTraversalType(), pc.getEstimatedWalkTime());
            adjacency.get(src.getId()).add(edge);
            if (pc.isBidirectional()) {
                Edge reverse = new Edge(dst.getId(), src.getId(), distance, true, pc.getTraversalType(), pc.getEstimatedWalkTime());
                adjacency.get(dst.getId()).add(reverse);
            }
        }
        return adjacency;
    }

    /**
     * Euclidean distance including floor difference.
     */
    private double calculateDistance(Node a, Node b) {
        double dx = a.getX() - b.getX();
        double dy = a.getY() - b.getY();
        double dz = (a.getFloorId() - b.getFloorId()) * FLOOR_HEIGHT;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Validate graph – returns list of isolated node IDs (no outgoing or incoming edges).
     */
    public List<Long> findIsolatedNodes(Map<Long, List<Edge>> adjacency) {
        Set<Long> withEdges = new HashSet<>();
        adjacency.forEach((src, edges) -> {
            if (!edges.isEmpty()) {
                withEdges.add(src);
                edges.forEach(e -> withEdges.add(e.getDestinationId()));
            }
        });
        return adjacency.keySet().stream()
                .filter(id -> !withEdges.contains(id))
                .collect(Collectors.toList());
    }
}
