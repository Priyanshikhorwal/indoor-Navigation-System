package com.project.service;

import com.project.entity.Location;
import com.project.entity.PathConnection;
import com.project.dto.NavigationResponseDto;
import com.project.dto.NavigationStepDto;
import com.project.repository.LocationRepository;
import com.project.repository.PathConnectionRepository;
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

    private final LocationRepository locationRepository;
    private final PathConnectionRepository pathConnectionRepository;
    private final RouteCacheRepository routeCacheRepository;
    private final ObjectMapper objectMapper;

    @Cacheable("graph")
    public Map<Location, List<Edge>> getGraphAdjacencyList() {
        List<PathConnection> allConnections = pathConnectionRepository.findAll();
        Map<Location, List<Edge>> graph = new HashMap<>();
        for (PathConnection pc : allConnections) {
            graph.computeIfAbsent(pc.getSourceLocation(), k -> new ArrayList<>())
                 .add(new Edge(pc.getDestinationLocation(), pc.getDistance(), pc.getIsAccessible(), pc.getDirectionType()));
                 
            if (Boolean.TRUE.equals(pc.getIsBidirectional())) {
                graph.computeIfAbsent(pc.getDestinationLocation(), k -> new ArrayList<>())
                     .add(new Edge(pc.getSourceLocation(), pc.getDistance(), pc.getIsAccessible(), getReverseDirection(pc.getDirectionType())));
            }
        }
        return graph;
    }

    private String getReverseDirection(String direction) {
        if (direction == null) return null;
        if ("UP".equalsIgnoreCase(direction)) return "DOWN";
        if ("DOWN".equalsIgnoreCase(direction)) return "UP";
        return direction;
    }

    public List<Location> findShortestPathAStar(Long sourceId, Long destinationId, boolean wheelchairAccessible) {
        Location source = locationRepository.findById(sourceId)
                .orElseThrow(() -> new EntityNotFoundException("Source not found with id: " + sourceId));
        Location destination = locationRepository.findById(destinationId)
                .orElseThrow(() -> new EntityNotFoundException("Destination not found with id: " + destinationId));

        Map<Location, List<Edge>> graph = getGraphAdjacencyList();

        // A* Algorithm
        PriorityQueue<Node> openSet = new PriorityQueue<>(Comparator.comparingDouble(n -> n.fScore));
        Map<Location, Location> cameFrom = new HashMap<>();
        
        Map<Location, Double> gScore = new HashMap<>();
        gScore.put(source, 0.0);

        openSet.add(new Node(source, 0.0, heuristic(source, destination)));

        while (!openSet.isEmpty()) {
            Node current = openSet.poll();
            if (current.gScore > gScore.getOrDefault(current.location, Double.MAX_VALUE)) {
                continue;
            }

            if (current.location.equals(destination)) {
                return reconstructPath(cameFrom, current.location);
            }

            for (Edge neighbor : graph.getOrDefault(current.location, Collections.emptyList())) {
                if (wheelchairAccessible) {
                    if (!neighbor.isAccessible || "STAIRS".equalsIgnoreCase(neighbor.location.getType())) {
                        continue; // Skip stairs or inaccessible edges for wheelchair routing
                    }
                }
                double tentativeGScore = gScore.getOrDefault(current.location, Double.MAX_VALUE) + neighbor.weight;

                if (tentativeGScore < gScore.getOrDefault(neighbor.location, Double.MAX_VALUE)) {
                    cameFrom.put(neighbor.location, current.location);
                    gScore.put(neighbor.location, tentativeGScore);
                    double fScore = tentativeGScore + heuristic(neighbor.location, destination);
                    
                    openSet.add(new Node(neighbor.location, tentativeGScore, fScore));
                }
            }
        }

        return Collections.emptyList(); // Path not found
    }

    private double heuristic(Location a, Location b) {
        double dx = a.getXCoordinate() - b.getXCoordinate();
        double dy = a.getYCoordinate() - b.getYCoordinate();
        
        int floorA = (a.getFloor() != null && a.getFloor().getFloorNumber() != null) ? a.getFloor().getFloorNumber() : 0;
        int floorB = (b.getFloor() != null && b.getFloor().getFloorNumber() != null) ? b.getFloor().getFloorNumber() : 0;
        
        double dz = 150.0 * (floorA - floorB);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    public NavigationResponseDto getNavigationRoute(Long sourceId, Long destinationId, boolean wheelchairAccessible) {
        // Attempt to fetch from DB Cache first
        Optional<RouteCache> cached = routeCacheRepository.findBySourceIdAndDestinationId(sourceId, destinationId);
        if (cached.isPresent() && cached.get().getCachedRoute() != null && !wheelchairAccessible) { // Only cache non-wheelchair for simplicity or create separate cache keys
            try {
                return objectMapper.readValue(cached.get().getCachedRoute(), NavigationResponseDto.class);
            } catch (JsonProcessingException e) {
                // Ignore and recalculate if parse fails
            }
        }

        List<Location> path = findShortestPathAStar(sourceId, destinationId, wheelchairAccessible);
        if (path.isEmpty()) {
            return new NavigationResponseDto(Collections.emptyList(), Collections.emptyList(), 0.0);
        }

        List<NavigationStepDto> steps = new ArrayList<>();
        double totalDist = 0.0;

        // Step 1: Start point
        Location start = path.get(0);
        String startFloorName = start.getFloor() != null ? start.getFloor().getFloorName() : "Unknown Floor";
        
        steps.add(new NavigationStepDto(
            "Start at " + start.getName() + " on floor " + startFloorName,
            "WALK_STRAIGHT",
            0.0,
            startFloorName
        ));

        for (int i = 0; i < path.size() - 1; i++) {
            Location curr = path.get(i);
            Location next = path.get(i + 1);

            String currFloorName = curr.getFloor() != null ? curr.getFloor().getFloorName() : "Unknown Floor";
            String nextFloorName = next.getFloor() != null ? next.getFloor().getFloorName() : "Unknown Floor";

            double dx = next.getXCoordinate() - curr.getXCoordinate();
            double dy = next.getYCoordinate() - curr.getYCoordinate();
            double legDist = Math.sqrt(dx * dx + dy * dy) * 0.5; // Scale: 1 unit = 0.5 meters
            totalDist += legDist;

            boolean floorChanged = !Objects.equals(
                curr.getFloor() != null ? curr.getFloor().getId() : null,
                next.getFloor() != null ? next.getFloor().getId() : null
            );
            
            if (floorChanged) {
                String action = "WALK_STRAIGHT";
                String instruction = "Change floor from " + currFloorName + " to " + nextFloorName + " towards " + next.getName();
                if ("ELEVATOR".equalsIgnoreCase(next.getType()) || "ELEVATOR".equalsIgnoreCase(curr.getType())) {
                    action = "TAKE_ELEVATOR";
                    instruction = "Take elevator from " + currFloorName + " to " + nextFloorName + " and proceed to " + next.getName();
                } else if ("STAIRS".equalsIgnoreCase(next.getType()) || "STAIRS".equalsIgnoreCase(curr.getType())) {
                    action = "TAKE_STAIRS";
                    instruction = "Take stairs from " + currFloorName + " to " + nextFloorName + " and proceed to " + next.getName();
                }
                steps.add(new NavigationStepDto(instruction, action, legDist, nextFloorName));
            } else {
                // If it is just a walk to the next location
                String directionText = "Walk " + String.format("%.1f", legDist) + " meters to " + next.getName();
                steps.add(new NavigationStepDto(directionText, "WALK_STRAIGHT", legDist, currFloorName));

                // Determine if there is a turn at 'next' transitioning to the subsequent node
                if (i < path.size() - 2) {
                    Location afterNext = path.get(i + 2);
                    
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

                        if (deg >= 25 && deg < 135) {
                            steps.add(new NavigationStepDto("At " + next.getName() + ", turn right towards " + afterNext.getName(), "TURN_RIGHT", 0.0, nextFloorName));
                        } else if (deg <= -25 && deg > -135) {
                            steps.add(new NavigationStepDto("At " + next.getName() + ", turn left towards " + afterNext.getName(), "TURN_LEFT", 0.0, nextFloorName));
                        } else if (deg >= 135 || deg <= -135) {
                            steps.add(new NavigationStepDto("At " + next.getName() + ", turn around towards " + afterNext.getName(), "TURN_RIGHT", 0.0, nextFloorName));
                        }
                    }
                }
            }
        }

        // Arrive step
        Location destination = path.get(path.size() - 1);
        String destFloorName = destination.getFloor() != null ? destination.getFloor().getFloorName() : "Unknown Floor";
        
        steps.add(new NavigationStepDto(
            "Arrive at your destination: " + destination.getName(),
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
                cacheEntry.setEstimatedTime((int) (totalDist / 1.4)); // approx 1.4 m/s walk speed
                
                // Count floor transitions
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
                // Ignore cache save failure
            }
        }
        
        return responseDto;
    }

    private List<Location> reconstructPath(Map<Location, Location> cameFrom, Location current) {
        List<Location> totalPath = new ArrayList<>();
        totalPath.add(current);
        while (cameFrom.containsKey(current)) {
            current = cameFrom.get(current);
            totalPath.add(0, current);
        }
        return totalPath;
    }

    private static class Edge {
        Location location;
        double weight;
        boolean isAccessible;
        String directionType;
        
        Edge(Location location, double weight, boolean isAccessible, String directionType) {
            this.location = location;
            this.weight = weight;
            this.isAccessible = isAccessible;
            this.directionType = directionType;
        }
    }

    private static class Node {
        Location location;
        double gScore;
        double fScore;
        Node(Location location, double gScore, double fScore) {
            this.location = location;
            this.gScore = gScore;
            this.fScore = fScore;
        }
    }
}
