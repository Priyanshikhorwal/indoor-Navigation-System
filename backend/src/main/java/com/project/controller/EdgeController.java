package com.project.controller;

import com.project.entity.Edge;
import com.project.entity.Node;
import com.project.repository.EdgeRepository;
import com.project.repository.NodeRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/edges")
@RequiredArgsConstructor
public class EdgeController {

    private final EdgeRepository edgeRepository;
    private final NodeRepository nodeRepository;

    @GetMapping
    public ResponseEntity<List<Edge>> getAllEdges() {
        return ResponseEntity.ok(edgeRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Edge> getEdgeById(@PathVariable Long id) {
        Edge edge = edgeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Edge not found with id: " + id));
        return ResponseEntity.ok(edge);
    }

    @PostMapping
    public ResponseEntity<Edge> createEdge(@Valid @RequestBody Edge edge) {
        if (edge.getSourceNode() == null || edge.getSourceNode().getId() == null) {
            throw new IllegalArgumentException("Source node ID must be provided");
        }
        if (edge.getDestinationNode() == null || edge.getDestinationNode().getId() == null) {
            throw new IllegalArgumentException("Destination node ID must be provided");
        }
        Node source = nodeRepository.findById(edge.getSourceNode().getId())
                .orElseThrow(() -> new EntityNotFoundException("Source node not found"));
        Node destination = nodeRepository.findById(edge.getDestinationNode().getId())
                .orElseThrow(() -> new EntityNotFoundException("Destination node not found"));
        edge.setSourceNode(source);
        edge.setDestinationNode(destination);

        // If distance is not provided, calculate Euclidean distance
        if (edge.getDistance() == null) {
            double dx = source.getXCoordinate() - destination.getXCoordinate();
            double dy = source.getYCoordinate() - destination.getYCoordinate();
            // If they are on different floors, add floor traversal cost
            double dz = 0.0;
            if (!source.getFloor().getId().equals(destination.getFloor().getId())) {
                dz = 150.0 * Math.abs(source.getFloor().getFloorNumber() - destination.getFloor().getFloorNumber());
            }
            edge.setDistance(Math.sqrt(dx * dx + dy * dy + dz * dz));
        }

        return ResponseEntity.ok(edgeRepository.save(edge));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Edge> updateEdge(@PathVariable Long id, @Valid @RequestBody Edge edgeDetails) {
        Edge edge = edgeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Edge not found with id: " + id));

        if (edgeDetails.getSourceNode() != null && edgeDetails.getSourceNode().getId() != null) {
            Node source = nodeRepository.findById(edgeDetails.getSourceNode().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Source node not found"));
            edge.setSourceNode(source);
        }

        if (edgeDetails.getDestinationNode() != null && edgeDetails.getDestinationNode().getId() != null) {
            Node destination = nodeRepository.findById(edgeDetails.getDestinationNode().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Destination node not found"));
            edge.setDestinationNode(destination);
        }

        edge.setIsAccessible(edgeDetails.getIsAccessible());
        edge.setIsBidirectional(edgeDetails.getIsBidirectional());
        edge.setDistance(edgeDetails.getDistance());

        return ResponseEntity.ok(edgeRepository.save(edge));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEdge(@PathVariable Long id) {
        Edge edge = edgeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Edge not found with id: " + id));
        edgeRepository.delete(edge);
        return ResponseEntity.ok().build();
    }
}
