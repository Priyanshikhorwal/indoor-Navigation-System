package com.project.controller;

import com.project.entity.Node;
import com.project.entity.Floor;
import com.project.entity.Room;
import com.project.repository.NodeRepository;
import com.project.repository.FloorRepository;
import com.project.repository.RoomRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nodes")
@RequiredArgsConstructor
public class NodeController {

    private final NodeRepository nodeRepository;
    private final FloorRepository floorRepository;
    private final RoomRepository roomRepository;

    @GetMapping
    public ResponseEntity<List<Node>> getAllNodes() {
        return ResponseEntity.ok(nodeRepository.findAll());
    }

    @GetMapping("/floor/{floorId}")
    public ResponseEntity<List<Node>> getNodesByFloor(@PathVariable Long floorId) {
        return ResponseEntity.ok(nodeRepository.findByFloorId(floorId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Node> getNodeById(@PathVariable Long id) {
        Node node = nodeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Node not found with id: " + id));
        return ResponseEntity.ok(node);
    }

    @PostMapping
    public ResponseEntity<Node> createNode(@Valid @RequestBody Node node) {
        if (node.getFloor() == null || node.getFloor().getId() == null) {
            throw new IllegalArgumentException("Floor ID must be provided");
        }
        Floor floor = floorRepository.findById(node.getFloor().getId())
                .orElseThrow(() -> new EntityNotFoundException("Floor not found"));
        node.setFloor(floor);

        if (node.getRoom() != null && node.getRoom().getId() != null) {
            Room room = roomRepository.findById(node.getRoom().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Room not found"));
            node.setRoom(room);
        }
        return ResponseEntity.ok(nodeRepository.save(node));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Node> updateNode(@PathVariable Long id, @Valid @RequestBody Node nodeDetails) {
        Node node = nodeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Node not found with id: " + id));

        node.setXCoordinate(nodeDetails.getXCoordinate());
        node.setYCoordinate(nodeDetails.getYCoordinate());

        if (nodeDetails.getFloor() != null && nodeDetails.getFloor().getId() != null) {
            Floor floor = floorRepository.findById(nodeDetails.getFloor().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Floor not found"));
            node.setFloor(floor);
        }

        if (nodeDetails.getRoom() != null && nodeDetails.getRoom().getId() != null) {
            Room room = roomRepository.findById(nodeDetails.getRoom().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Room not found"));
            node.setRoom(room);
        } else {
            node.setRoom(null);
        }

        return ResponseEntity.ok(nodeRepository.save(node));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNode(@PathVariable Long id) {
        Node node = nodeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Node not found with id: " + id));
        nodeRepository.delete(node);
        return ResponseEntity.ok().build();
    }
}
