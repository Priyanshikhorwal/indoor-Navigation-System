package com.project.service;

import com.project.entity.Node;
import com.project.entity.Edge;
import com.project.entity.Room;
import com.project.dto.NavigationResponseDto;
import com.project.dto.NavigationStepDto;
import com.project.repository.NodeRepository;
import com.project.repository.EdgeRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.cache.annotation.Cacheable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.project.entity.RouteCache;
import com.project.repository.RouteCacheRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;

import java.util.*;

@Service
@RequiredArgsConstructor
public class NavigationService {

    private final NodeRepository nodeRepository;
    private final EdgeRepository edgeRepository;
    private final RouteCacheRepository routeCacheRepository;
    private final ObjectMapper objectMapper;

    public Map<Node, List<GraphEdge>> getGraphAdjacencyList() {
        List<Edge> allEdges = edgeRepository.findAll();
        Map<Node, List<GraphEdge>> graph = new HashMap<>();
        for (Edge e : allEdges) {
            graph.computeIfAbsent(e.getSourceNode(), k -> new ArrayList<>())
                 .add(new GraphEdge(e.getDestinationNode(), e.getDistance(), e.getIsAccessible()));
                 
            if (Boolean.TRUE.equals(e.getIsBidirectional())) {
                graph.computeIfAbsent(e.getDestinationNode(), k -> new ArrayList<>())
                     .add(new GraphEdge(e.getSourceNode(), e.getDistance(), e.getIsAccessible()));
            }
        }
        return graph;
    }

    public List<Node> findShortestPathAStar(Node source, Node destination, boolean wheelchairAccessible) {
        Map<Node, List<GraphEdge>> graph = getGraphAdjacencyList();

        // A* Algorithm
        PriorityQueue<AStarNode> openSet = new PriorityQueue<>(Comparator.comparingDouble(n -> n.fScore));
        Map<Node, Node> cameFrom = new HashMap<>();
        
        Map<Node, Double> gScore = new HashMap<>();
        gScore.put(source, 0.0);

        openSet.add(new AStarNode(source, 0.0, heuristic(source, destination)));

        while (!openSet.isEmpty()) {
            AStarNode current = openSet.poll();
            if (current.gScore > gScore.getOrDefault(current.node, Double.MAX_VALUE)) {
                continue;
            }

            if (current.node.equals(destination)) {
                return reconstructPath(cameFrom, current.node);
            }

            for (GraphEdge neighbor : graph.getOrDefault(current.node, Collections.emptyList())) {
                if (wheelchairAccessible && !neighbor.isAccessible) {
                    continue; // Skip inaccessible edges (like stairs) for wheelchair routing
                }
                
                double tentativeGScore = gScore.getOrDefault(current.node, Double.MAX_VALUE) + neighbor.weight;

                if (tentativeGScore < gScore.getOrDefault(neighbor.targetNode, Double.MAX_VALUE)) {
                    cameFrom.put(neighbor.targetNode, current.node);
                    gScore.put(neighbor.targetNode, tentativeGScore);
                    double fScore = tentativeGScore + heuristic(neighbor.targetNode, destination);
                    
                    openSet.add(new AStarNode(neighbor.targetNode, tentativeGScore, fScore));
                }
            }
        }

        return Collections.emptyList(); // Path not found
    }

    private double heuristic(Node a, Node b) {
        double dx = a.getXCoordinate() - b.getXCoordinate();
        double dy = a.getYCoordinate() - b.getYCoordinate();
        
        int floorA = (a.getFloor() != null && a.getFloor().getFloorNumber() != null) ? a.getFloor().getFloorNumber() : 0;
        int floorB = (b.getFloor() != null && b.getFloor().getFloorNumber() != null) ? b.getFloor().getFloorNumber() : 0;
        
        double dz = 150.0 * (floorA - floorB);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    public NavigationResponseDto getNavigationRoute(Long sourceId, Long destinationId, boolean wheelchairAccessible) {
        // Clear route cache if entities modified, or just try fetching
        Optional<RouteCache> cached = routeCacheRepository.findBySourceIdAndDestinationId(sourceId, destinationId);
        if (cached.isPresent() && cached.get().getCachedRoute() != null && !wheelchairAccessible) {
            try {
                return objectMapper.readValue(cached.get().getCachedRoute(), NavigationResponseDto.class);
            } catch (JsonProcessingException e) {
                // Recalculate if parse fails
            }
        }

        // Resolve source and destination Rooms/Nodes
        Node sourceNode = nodeRepository.findByRoomId(sourceId)
                .orElseGet(() -> nodeRepository.findById(sourceId)
                        .orElseThrow(() -> new EntityNotFoundException("Source location/room not found with id: " + sourceId)));
        
        Node destNode = nodeRepository.findByRoomId(destinationId)
                .orElseGet(() -> nodeRepository.findById(destinationId)
                        .orElseThrow(() -> new EntityNotFoundException("Destination location/room not found with id: " + destinationId)));

        List<Node> path = findShortestPathAStar(sourceNode, destNode, wheelchairAccessible);
        if (path.isEmpty()) {
            return new NavigationResponseDto(Collections.emptyList(), Collections.emptyList(), 0.0);
        }

        List<NavigationStepDto> steps = new ArrayList<>();
        double totalDist = 0.0;

        // Step 1: Start point
        Node start = path.get(0);
        String startFloorName = start.getFloor() != null ? start.getFloor().getFloorName() : "Unknown Floor";
        String startName = start.getRoom() != null ? start.getRoom().getName() : "Entrance Point";
        
        steps.add(new NavigationStepDto(
            "Start at " + startName + " on " + startFloorName,
            "WALK_STRAIGHT",
            0.0,
            startFloorName
        ));

        for (int i = 0; i < path.size() - 1; i++) {
            Node curr = path.get(i);
            Node next = path.get(i + 1);

            String currFloorName = curr.getFloor() != null ? curr.getFloor().getFloorName() : "Unknown Floor";
            String nextFloorName = next.getFloor() != null ? next.getFloor().getFloorName() : "Unknown Floor";
            String nextName = next.getRoom() != null ? next.getRoom().getName() : "Corridor junction";

            double dx = next.getXCoordinate() - curr.getXCoordinate();
            double dy = next.getYCoordinate() - curr.getYCoordinate();
            double legDist = Math.sqrt(dx * dx + dy * dy) * 0.1; // Scale: 1 unit = 0.1 meters
            totalDist += legDist;

            boolean floorChanged = !Objects.equals(
                curr.getFloor() != null ? curr.getFloor().getId() : null,
                next.getFloor() != null ? next.getFloor().getId() : null
            );
            
            if (floorChanged) {
                String action = "WALK_STRAIGHT";
                String instruction = "Change floor from " + currFloorName + " to " + nextFloorName + " towards " + nextName;
                
                String currType = curr.getRoom() != null ? curr.getRoom().getType() : "";
                String nextType = next.getRoom() != null ? next.getRoom().getType() : "";
                
                if ("LIFT".equalsIgnoreCase(nextType) || "LIFT".equalsIgnoreCase(currType)) {
                    action = "TAKE_ELEVATOR";
                    instruction = "Take lift from " + currFloorName + " to " + nextFloorName + " and proceed to " + nextName;
                } else if ("STAIRS".equalsIgnoreCase(nextType) || "STAIRS".equalsIgnoreCase(currType)) {
                    action = "TAKE_STAIRS";
                    instruction = "Take stairs from " + currFloorName + " to " + nextFloorName + " and proceed to " + nextName;
                }
                steps.add(new NavigationStepDto(instruction, action, legDist, nextFloorName));
            } else {
                String directionText = "Walk " + String.format("%.1f", legDist) + " meters to " + nextName;
                steps.add(new NavigationStepDto(directionText, "WALK_STRAIGHT", legDist, currFloorName));

                // Direction turns
                if (i < path.size() - 2) {
                    Node afterNext = path.get(i + 2);
                    boolean floorChangedNext = !Objects.equals(
                        next.getFloor() != null ? next.getFloor().getId() : null,
                        afterNext.getFloor() != null ? afterNext.getFloor().getId() : null
                    );
                    
                    if (!floorChangedNext) {
                        double theta1 = Math.atan2(next.getYCoordinate() - curr.getYCoordinate(), next.getXCoordinate() - curr.getXCoordinate());
                        double theta2 = Math.atan2(afterNext.getYCoordinate() - next.getYCoordinate(), afterNext.getXCoordinate() - next.getXCoordinate());
                        double diff = theta2 - theta1;
                        while (diff < -Math.PI) diff += 2 * Math.PI;
                        while (diff > Math.PI) diff -= 2 * Math.PI;
                        double deg = Math.toDegrees(diff);

                        String afterNextName = afterNext.getRoom() != null ? afterNext.getRoom().getName() : "next segment";

                        if (deg >= 25 && deg < 135) {
                            steps.add(new NavigationStepDto("At " + nextName + ", turn right towards " + afterNextName, "TURN_RIGHT", 0.0, nextFloorName));
                        } else if (deg <= -25 && deg > -135) {
                            steps.add(new NavigationStepDto("At " + nextName + ", turn left towards " + afterNextName, "TURN_LEFT", 0.0, nextFloorName));
                        } else if (deg >= 135 || deg <= -135) {
                            steps.add(new NavigationStepDto("At " + nextName + ", turn around towards " + afterNextName, "TURN_RIGHT", 0.0, nextFloorName));
                        }
                    }
                }
            }
        }

        // Arrive step
        Node destination = path.get(path.size() - 1);
        String destFloorName = destination.getFloor() != null ? destination.getFloor().getFloorName() : "Unknown Floor";
        String destName = destination.getRoom() != null ? destination.getRoom().getName() : "Destination";
        
        steps.add(new NavigationStepDto(
            "Arrive at your destination: " + destName,
            "ARRIVE",
            0.0,
            destFloorName
        ));

        NavigationResponseDto responseDto = new NavigationResponseDto(path, steps, totalDist);
        
        // Save to DB Cache
        if (!wheelchairAccessible) {
            try {
                RouteCache cacheEntry = cached.orElseGet(RouteCache::new);
                cacheEntry.setSourceId(sourceId);
                cacheEntry.setDestinationId(destinationId);
                cacheEntry.setTotalDistance(totalDist);
                cacheEntry.setEstimatedTime((int) (totalDist / 1.4)); // approx 1.4 m/s
                
                int floorTransitions = 0;
                for (NavigationStepDto step : steps) {
                    if ("TAKE_ELEVATOR".equals(step.getAction()) || "TAKE_STAIRS".equals(step.getAction())) {
                        floorTransitions++;
                    }
                }
                cacheEntry.setFloorTransitionCount(floorTransitions);
                cacheEntry.setCachedRoute(objectMapper.writeValueAsString(responseDto));
                routeCacheRepository.save(cacheEntry);
            } catch (JsonProcessingException e) {
                // Ignore cache write error
            }
        }
        
        return responseDto;
    }

    private List<Node> reconstructPath(Map<Node, Node> cameFrom, Node current) {
        List<Node> totalPath = new ArrayList<>();
        totalPath.add(current);
        while (cameFrom.containsKey(current)) {
            current = cameFrom.get(current);
            totalPath.add(0, current);
        }
        return totalPath;
    }

    public static class GraphEdge {
        public Node targetNode;
        public double weight;
        public boolean isAccessible;
        
        public GraphEdge(Node targetNode, double weight, boolean isAccessible) {
            this.targetNode = targetNode;
            this.weight = weight;
            this.isAccessible = isAccessible;
        }
    }

    private static class AStarNode {
        Node node;
        double gScore;
        double fScore;
        AStarNode(Node node, double gScore, double fScore) {
            this.node = node;
            this.gScore = gScore;
            this.fScore = fScore;
        }
    }
}
