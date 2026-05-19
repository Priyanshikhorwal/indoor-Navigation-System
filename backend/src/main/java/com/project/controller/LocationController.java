package com.project.controller;

import com.project.entity.Location;
import com.project.entity.PathConnection;
import com.project.repository.LocationRepository;
import com.project.repository.PathConnectionRepository;
import com.project.repository.FloorRepository;
import com.project.entity.Floor;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.Valid;
import org.springframework.cache.annotation.CacheEvict;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Queue;
import java.util.LinkedList;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationRepository locationRepository;
    private final PathConnectionRepository pathConnectionRepository;
    private final FloorRepository floorRepository;

    @GetMapping
    public ResponseEntity<List<Location>> getAllLocations() {
        return ResponseEntity.ok(locationRepository.findAll());
    }

    @PostMapping
    @CacheEvict(value = "graph", allEntries = true)
    public ResponseEntity<Location> createLocation(@Valid @RequestBody Location location) {
        if (location.getFloor() != null && location.getFloor().getId() != null) {
            Floor floor = floorRepository.findById(location.getFloor().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Floor not found"));
            location.setFloor(floor);
        }
        return ResponseEntity.ok(locationRepository.save(location));
    }

    @PutMapping("/{id}")
    @CacheEvict(value = "graph", allEntries = true)
    public ResponseEntity<Location> updateLocation(@PathVariable Long id, @Valid @RequestBody Location locationDetails) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Location not found with id: " + id));

        location.setName(locationDetails.getName());
        location.setDescription(locationDetails.getDescription());
        location.setXCoordinate(locationDetails.getXCoordinate());
        location.setYCoordinate(locationDetails.getYCoordinate());
        
        if (locationDetails.getFloor() != null && locationDetails.getFloor().getId() != null) {
            Floor floor = floorRepository.findById(locationDetails.getFloor().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Floor not found"));
            location.setFloor(floor);
        } else {
            location.setFloor(null);
        }

        return ResponseEntity.ok(locationRepository.save(location));
    }

    @DeleteMapping("/{id}")
    @CacheEvict(value = "graph", allEntries = true)
    @Transactional
    public ResponseEntity<Void> deleteLocation(@PathVariable Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Location not found with id: " + id));

        // Custom cascade: clean up all edges referencing this location before deleting the node
        List<PathConnection> connections = pathConnectionRepository.findBySourceLocationOrDestinationLocation(location, location);
        pathConnectionRepository.deleteAll(connections);

        locationRepository.delete(location);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bulk")
    @CacheEvict(value = "graph", allEntries = true)
    public ResponseEntity<List<Location>> createLocationsBulk(@Valid @RequestBody List<Location> locations) {
        return ResponseEntity.ok(locationRepository.saveAll(locations));
    }

    @GetMapping("/validate")
    public ResponseEntity<GraphValidationResult> validateGraph() {
        List<Location> locations = locationRepository.findAll();
        List<PathConnection> connections = pathConnectionRepository.findAll();

        Map<Long, Set<Long>> adj = new HashMap<>();
        for (Location loc : locations) {
            adj.put(loc.getId(), new HashSet<>());
        }
        for (PathConnection pc : connections) {
            if (pc.getSourceLocation() != null && pc.getDestinationLocation() != null) {
                Long sId = pc.getSourceLocation().getId();
                Long dId = pc.getDestinationLocation().getId();
                if (adj.containsKey(sId) && adj.containsKey(dId)) {
                    adj.get(sId).add(dId);
                    if (Boolean.TRUE.equals(pc.getIsBidirectional())) {
                        adj.get(dId).add(sId);
                    }
                }
            }
        }

        // 1. Isolated Nodes
        List<Location> isolatedNodes = new ArrayList<>();
        for (Location loc : locations) {
            if (adj.get(loc.getId()).isEmpty()) {
                isolatedNodes.add(loc);
            }
        }

        // 2. Find Connected Components
        Set<Long> visited = new HashSet<>();
        List<Set<Long>> components = new ArrayList<>();
        for (Location loc : locations) {
            Long id = loc.getId();
            if (!visited.contains(id)) {
                Set<Long> component = new HashSet<>();
                Queue<Long> queue = new LinkedList<>();
                queue.add(id);
                visited.add(id);
                while (!queue.isEmpty()) {
                    Long curr = queue.poll();
                    component.add(curr);
                    for (Long neighbor : adj.get(curr)) {
                        if (!visited.contains(neighbor)) {
                            visited.add(neighbor);
                            queue.add(neighbor);
                        }
                    }
                }
                components.add(component);
            }
        }

        // 3. Unreachable Floors
        Set<Long> allFloors = new HashSet<>();
        for (Location loc : locations) {
            if (loc.getFloor() != null) {
                allFloors.add(loc.getFloor().getId());
            }
        }

        List<Long> unreachableFloors = new ArrayList<>();
        if (allFloors.size() > 1) {
            for (Long floorId : allFloors) {
                boolean hasConnectionToOtherFloor = false;
                for (Location loc : locations) {
                    if (loc.getFloor() != null && floorId.equals(loc.getFloor().getId())) {
                        for (Set<Long> comp : components) {
                            if (comp.contains(loc.getId())) {
                                for (Long otherId : comp) {
                                    Location otherLoc = locations.stream()
                                            .filter(l -> l.getId().equals(otherId))
                                            .findFirst().orElse(null);
                                    if (otherLoc != null && otherLoc.getFloor() != null && !floorId.equals(otherLoc.getFloor().getId())) {
                                        hasConnectionToOtherFloor = true;
                                        break;
                                    }
                                }
                            }
                            if (hasConnectionToOtherFloor) break;
                        }
                    }
                    if (hasConnectionToOtherFloor) break;
                }
                if (!hasConnectionToOtherFloor) {
                    unreachableFloors.add(floorId);
                }
            }
        }

        boolean healthy = isolatedNodes.isEmpty() && unreachableFloors.isEmpty() && (components.size() <= 1);
        if (locations.isEmpty()) {
            healthy = true;
        }

        GraphValidationResult result = new GraphValidationResult(
                healthy,
                isolatedNodes,
                unreachableFloors,
                components.size(),
                locations.size(),
                connections.size()
        );

        return ResponseEntity.ok(result);
    }

    public static record GraphValidationResult(
        boolean healthy,
        List<Location> isolatedNodes,
        List<Long> unreachableFloors,
        int totalComponents,
        int totalLocations,
        int totalConnections
    ) {}
}
