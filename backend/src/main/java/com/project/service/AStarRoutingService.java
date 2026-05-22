package com.project.service;

import com.project.entity.Location;
import com.project.entity.PathConnection;
import com.project.graph.Edge;
import com.project.graph.Node;
import com.project.model.NavigationRequest;
import com.project.model.NavigationResponse;
import com.project.model.RouteResult;
import com.project.repository.LocationRepository;
import com.project.repository.PathConnectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * A* routing service that computes the shortest path between two locations.
 * Supports multi‑floor traversal by adding a fixed penalty for floor changes.
 */
@Service
@RequiredArgsConstructor
public class AStarRoutingService {

    private final LocationRepository locationRepository;
    private final PathConnectionRepository pathConnectionRepository;
    private final GraphGenerationService graphGenerationService;
    private final NavigationInstructionService instructionService;

    private static final double FLOOR_PENALTY = 10.0; // additional distance cost per floor transition

    /**
     * Compute the shortest path between source and destination location IDs.
     */
    public NavigationResponse shortestPath(NavigationRequest request) {
        Long sourceId = request.getSourceId();
        Long targetId = request.getDestinationId();
        Map<Long, List<Edge>> graph = graphGenerationService.generateGraph();
        if (!graph.containsKey(sourceId) || !graph.containsKey(targetId)) {
            return NavigationResponse.empty();
        }
        // A* algorithm
        Set<Long> closedSet = new HashSet<>();
        Map<Long, Double> gScore = new HashMap<>(); // cost from start to node
        Map<Long, Double> fScore = new HashMap<>(); // estimated total cost
        Map<Long, Edge> cameFrom = new HashMap<>();

        gScore.put(sourceId, 0.0);
        fScore.put(sourceId, heuristic(sourceId, targetId));

        PriorityQueue<Long> openSet = new PriorityQueue<>(Comparator.comparingDouble(fScore::get));
        openSet.add(sourceId);

        while (!openSet.isEmpty()) {
            Long current = openSet.poll();
            if (current.equals(targetId)) {
                // reconstruct path
                List<Edge> pathEdges = reconstructPath(cameFrom, current);
                return instructionService.generateResponse(pathEdges);
            }
            closedSet.add(current);
            for (Edge edge : graph.getOrDefault(current, Collections.emptyList())) {
                Long neighbor = edge.getTargetId();
                if (closedSet.contains(neighbor)) continue;
                double tentativeG = gScore.getOrDefault(current, Double.MAX_VALUE) + edge.getWeight();
                if (tentativeG < gScore.getOrDefault(neighbor, Double.MAX_VALUE)) {
                    cameFrom.put(neighbor, edge);
                    gScore.put(neighbor, tentativeG);
                    fScore.put(neighbor, tentativeG + heuristic(neighbor, targetId));
                    if (!openSet.contains(neighbor)) {
                        openSet.add(neighbor);
                    }
                }
            }
        }
        // No path found
        return NavigationResponse.empty();
    }

    /**
     * Heuristic: Euclidean distance (including floor penalty).
     */
    private double heuristic(Long aId, Long bId) {
        Optional<Location> aOpt = locationRepository.findById(aId);
        Optional<Location> bOpt = locationRepository.findById(bId);
        if (aOpt.isEmpty() || bOpt.isEmpty()) return 0.0;
        Location a = aOpt.get();
        Location b = bOpt.get();
        double dx = a.getXCoordinate() - b.getXCoordinate();
        double dy = a.getYCoordinate() - b.getYCoordinate();
        double dz = (a.getFloor().getId() - b.getFloor().getId()) * FLOOR_PENALTY;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    private List<Edge> reconstructPath(Map<Long, Edge> cameFrom, Long current) {
        List<Edge> totalPath = new LinkedList<>();
        while (cameFrom.containsKey(current)) {
            Edge edge = cameFrom.get(current);
            totalPath.add(0, edge);
            current = edge.getSourceId();
        }
        return totalPath;
    }
}
