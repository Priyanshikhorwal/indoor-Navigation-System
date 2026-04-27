package com.project.service;

import com.project.entity.Location;
import com.project.entity.PathConnection;
import com.project.repository.LocationRepository;
import com.project.repository.PathConnectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class NavigationService {

    private final LocationRepository locationRepository;
    private final PathConnectionRepository pathConnectionRepository;

    public List<Location> findShortestPathAStar(Long sourceId, Long destinationId) {
        Location source = locationRepository.findById(sourceId)
                .orElseThrow(() -> new RuntimeException("Source not found"));
        Location destination = locationRepository.findById(destinationId)
                .orElseThrow(() -> new RuntimeException("Destination not found"));

        List<PathConnection> allConnections = pathConnectionRepository.findAll();

        // Building Adjacency List
        Map<Location, List<Edge>> graph = new HashMap<>();
        for (PathConnection pc : allConnections) {
            graph.computeIfAbsent(pc.getSourceLocation(), k -> new ArrayList<>())
                 .add(new Edge(pc.getDestinationLocation(), pc.getDistance()));
            graph.computeIfAbsent(pc.getDestinationLocation(), k -> new ArrayList<>())
                 .add(new Edge(pc.getSourceLocation(), pc.getDistance())); // Undirected graph
        }

        // A* Algorithm
        PriorityQueue<Node> openSet = new PriorityQueue<>(Comparator.comparingDouble(n -> n.fScore));
        Map<Location, Location> cameFrom = new HashMap<>();
        
        Map<Location, Double> gScore = new HashMap<>();
        gScore.put(source, 0.0);

        openSet.add(new Node(source, 0.0, heuristic(source, destination)));

        while (!openSet.isEmpty()) {
            Node current = openSet.poll();

            if (current.location.equals(destination)) {
                return reconstructPath(cameFrom, current.location);
            }

            for (Edge neighbor : graph.getOrDefault(current.location, Collections.emptyList())) {
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
        // Euclidean distance as heuristic
        return Math.sqrt(Math.pow(a.getXCoordinate() - b.getXCoordinate(), 2) + 
                         Math.pow(a.getYCoordinate() - b.getYCoordinate(), 2));
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
        Edge(Location location, double weight) {
            this.location = location;
            this.weight = weight;
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
