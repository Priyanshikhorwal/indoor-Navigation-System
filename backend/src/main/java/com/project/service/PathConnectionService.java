package com.project.service;

import com.project.dto.PathConnectionDto;
import com.project.entity.Location;
import com.project.entity.PathConnection;
import com.project.repository.LocationRepository;
import com.project.repository.PathConnectionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.cache.annotation.CacheEvict;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PathConnectionService {

    private final PathConnectionRepository pathConnectionRepository;
    private final LocationRepository locationRepository;

    public List<PathConnection> getAllConnections() {
        return pathConnectionRepository.findAll();
    }

    @CacheEvict(value = "graph", allEntries = true)
    public PathConnection createConnection(PathConnectionDto dto) {
        if (dto.getSourceLocationId().equals(dto.getDestinationLocationId())) {
            throw new IllegalArgumentException("Cannot create a connection from a location to itself.");
        }

        Location source = locationRepository.findById(dto.getSourceLocationId())
                .orElseThrow(() -> new EntityNotFoundException("Source location not found with id: " + dto.getSourceLocationId()));
        Location destination = locationRepository.findById(dto.getDestinationLocationId())
                .orElseThrow(() -> new EntityNotFoundException("Destination location not found with id: " + dto.getDestinationLocationId()));

        boolean exists = pathConnectionRepository.existsBySourceLocationAndDestinationLocation(source, destination) ||
                         pathConnectionRepository.existsBySourceLocationAndDestinationLocation(destination, source);
        if (exists) {
            throw new IllegalArgumentException("A connection already exists between these locations.");
        }

        double distance = dto.getDistance() != null ? dto.getDistance() : calculateEuclideanDistance(source, destination);

        PathConnection connection = new PathConnection();
        connection.setSourceLocation(source);
        connection.setDestinationLocation(destination);
        connection.setDistance(distance);
        connection.setIsAccessible(dto.getIsAccessible());
        
        if (dto.getIsBidirectional() != null) {
            connection.setIsBidirectional(dto.getIsBidirectional());
        }
        connection.setDirectionType(dto.getDirectionType());

        return pathConnectionRepository.save(connection);
    }

    @CacheEvict(value = "graph", allEntries = true)
    public PathConnection updateConnection(Long id, PathConnectionDto dto) {
        PathConnection connection = pathConnectionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Path connection not found with id: " + id));

        if (dto.getSourceLocationId().equals(dto.getDestinationLocationId())) {
            throw new IllegalArgumentException("Cannot create a connection from a location to itself.");
        }

        Location source = locationRepository.findById(dto.getSourceLocationId())
                .orElseThrow(() -> new EntityNotFoundException("Source location not found with id: " + dto.getSourceLocationId()));
        Location destination = locationRepository.findById(dto.getDestinationLocationId())
                .orElseThrow(() -> new EntityNotFoundException("Destination location not found with id: " + dto.getDestinationLocationId()));

        // Check for duplicate connections excluding this connection
        List<PathConnection> allConnections = pathConnectionRepository.findAll();
        for (PathConnection pc : allConnections) {
            if (!pc.getId().equals(id)) {
                boolean matchesDirect = pc.getSourceLocation().getId().equals(source.getId()) && pc.getDestinationLocation().getId().equals(destination.getId());
                boolean matchesReverse = pc.getSourceLocation().getId().equals(destination.getId()) && pc.getDestinationLocation().getId().equals(source.getId());
                if (matchesDirect || matchesReverse) {
                    throw new IllegalArgumentException("A connection already exists between these locations.");
                }
            }
        }

        double distance = dto.getDistance() != null ? dto.getDistance() : calculateEuclideanDistance(source, destination);

        connection.setSourceLocation(source);
        connection.setDestinationLocation(destination);
        connection.setDistance(distance);
        connection.setIsAccessible(dto.getIsAccessible() != null ? dto.getIsAccessible() : true);
        
        if (dto.getIsBidirectional() != null) {
            connection.setIsBidirectional(dto.getIsBidirectional());
        }
        connection.setDirectionType(dto.getDirectionType());

        return pathConnectionRepository.save(connection);
    }

    @CacheEvict(value = "graph", allEntries = true)
    public void deleteConnection(Long id) {
        if (!pathConnectionRepository.existsById(id)) {
            throw new EntityNotFoundException("Path connection not found with id: " + id);
        }
        pathConnectionRepository.deleteById(id);
    }

    private double calculateEuclideanDistance(Location a, Location b) {
        return Math.sqrt(Math.pow(a.getXCoordinate() - b.getXCoordinate(), 2) +
                         Math.pow(a.getYCoordinate() - b.getYCoordinate(), 2));
    }
}
