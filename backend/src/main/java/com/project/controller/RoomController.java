package com.project.controller;

import com.project.entity.Room;
import com.project.entity.Floor;
import com.project.repository.RoomRepository;
import com.project.repository.FloorRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomRepository roomRepository;
    private final FloorRepository floorRepository;

    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(roomRepository.findAll());
    }

    @GetMapping("/floor/{floorId}")
    public ResponseEntity<List<Room>> getRoomsByFloor(@PathVariable Long floorId) {
        return ResponseEntity.ok(roomRepository.findByFloorId(floorId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoomById(@PathVariable Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Room not found with id: " + id));
        return ResponseEntity.ok(room);
    }

    @PostMapping
    public ResponseEntity<Room> createRoom(@Valid @RequestBody Room room) {
        if (room.getFloor() == null || room.getFloor().getId() == null) {
            throw new IllegalArgumentException("Floor ID must be provided");
        }
        Floor floor = floorRepository.findById(room.getFloor().getId())
                .orElseThrow(() -> new EntityNotFoundException("Floor not found"));
        room.setFloor(floor);
        return ResponseEntity.ok(roomRepository.save(room));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Room> updateRoom(@PathVariable Long id, @Valid @RequestBody Room roomDetails) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Room not found with id: " + id));

        room.setName(roomDetails.getName());
        room.setDescription(roomDetails.getDescription());
        room.setType(roomDetails.getType());

        if (roomDetails.getFloor() != null && roomDetails.getFloor().getId() != null) {
            Floor floor = floorRepository.findById(roomDetails.getFloor().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Floor not found"));
            room.setFloor(floor);
        }

        return ResponseEntity.ok(roomRepository.save(room));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Room not found with id: " + id));
        roomRepository.delete(room);
        return ResponseEntity.ok().build();
    }
}
