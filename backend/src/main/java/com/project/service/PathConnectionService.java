package com.project.service;

import com.project.dto.PathConnectionDto;
import com.project.entity.Location;
import com.project.entity.PathConnection;
import com.project.repository.LocationRepository;
import com.project.repository.PathConnectionRepository;
import jakarta.persistence.EntityNotFoundException;
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

    public PathConnection createConnection(PathConnectionDto dto) {
        Location source = locationRepository.findById(dto.getSourceLocationId())
                .orElseThrow(() -> new EntityNotFoundException("Source location not found with id: " + dto.getSourceLocationId()));
        Location destination = locationRepository.findById(dto.getDestinationLocationId())
                .orElseThrow(() -> new EntityNotFoundException("Destination location not found with id: " + dto.getDestinationLocationId()));

        double distance = dto.getDistance() != null ? dto.getDistance() : calculateEuclideanDistance(source, destination);

        PathConnection connection = new PathConnection();
        connection.setSourceLocation(source);
        connection.setDestinationLocation(destination);
        connection.setDistance(distance);

        return pathConnectionRepository.save(connection);
    }

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
