package com.project.controller;

import com.project.entity.Floor;
import com.project.entity.Building;
import com.project.repository.FloorRepository;
import com.project.repository.BuildingRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/floors")
@RequiredArgsConstructor
public class FloorController {

    private final FloorRepository floorRepository;
    private final BuildingRepository buildingRepository;
    private final com.project.service.SvgFloorplanParserService svgFloorplanParserService;
    
    private final String UPLOAD_DIR = "uploads/";

    @GetMapping
    public ResponseEntity<List<Floor>> getAllFloors() {
        return ResponseEntity.ok(floorRepository.findAll());
    }
    
    @GetMapping("/building/{buildingId}")
    public ResponseEntity<List<Floor>> getFloorsByBuilding(@PathVariable Long buildingId) {
        return ResponseEntity.ok(floorRepository.findByBuildingId(buildingId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Floor> getFloorById(@PathVariable Long id) {
        Floor floor = floorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Floor not found with id: " + id));
        return ResponseEntity.ok(floor);
    }

    @PostMapping
    public ResponseEntity<Floor> createFloor(@Valid @RequestBody Floor floor) {
        if (floor.getBuilding() == null || floor.getBuilding().getId() == null) {
            throw new IllegalArgumentException("Building ID must be provided");
        }
        Building building = buildingRepository.findById(floor.getBuilding().getId())
                .orElseThrow(() -> new EntityNotFoundException("Building not found"));
        floor.setBuilding(building);
        return ResponseEntity.ok(floorRepository.save(floor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Floor> updateFloor(@PathVariable Long id, @Valid @RequestBody Floor floorDetails) {
        Floor floor = floorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Floor not found with id: " + id));

        floor.setFloorName(floorDetails.getFloorName());
        floor.setFloorNumber(floorDetails.getFloorNumber());
        
        if (floorDetails.getBuilding() != null && floorDetails.getBuilding().getId() != null) {
            Building building = buildingRepository.findById(floorDetails.getBuilding().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Building not found"));
            floor.setBuilding(building);
        }

        return ResponseEntity.ok(floorRepository.save(floor));
    }
    
    @PostMapping("/{id}/map")
    public ResponseEntity<Floor> uploadMapImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        Floor floor = floorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Floor not found with id: " + id));
                
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            String fileName = StringUtils.cleanPath(file.getOriginalFilename());
            String uniqueFileName = UUID.randomUUID().toString() + "_" + fileName;
            
            Path filePath = uploadPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            floor.setMapImageUrl("/uploads/" + uniqueFileName);
            floorRepository.save(floor);
            
            // If the file is an SVG, automatically generate the map graph
            if (fileName.toLowerCase().endsWith(".svg")) {
                svgFloorplanParserService.parseSvgAndGenerateGraph(filePath, floor);
            }
            
            return ResponseEntity.ok(floor);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFloor(@PathVariable Long id) {
        Floor floor = floorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Floor not found with id: " + id));
        
        floorRepository.delete(floor);
        return ResponseEntity.ok().build();
    }
}
