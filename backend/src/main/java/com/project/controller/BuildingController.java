package com.project.controller;

import com.project.entity.Building;
import com.project.repository.BuildingRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buildings")
@RequiredArgsConstructor
public class BuildingController {

    private final BuildingRepository buildingRepository;

    @GetMapping
    public ResponseEntity<List<Building>> getAllBuildings() {
        return ResponseEntity.ok(buildingRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Building> getBuildingById(@PathVariable Long id) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Building not found with id: " + id));
        return ResponseEntity.ok(building);
    }

    @PostMapping
    public ResponseEntity<Building> createBuilding(@Valid @RequestBody Building building) {
        return ResponseEntity.ok(buildingRepository.save(building));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Building> updateBuilding(@PathVariable Long id, @Valid @RequestBody Building buildingDetails) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Building not found with id: " + id));

        building.setName(buildingDetails.getName());
        building.setDescription(buildingDetails.getDescription());

        return ResponseEntity.ok(buildingRepository.save(building));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBuilding(@PathVariable Long id) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Building not found with id: " + id));
        
        buildingRepository.delete(building);
        return ResponseEntity.ok().build();
    }
}
