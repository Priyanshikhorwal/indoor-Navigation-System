package com.project.controller;

import com.project.entity.Location;
import com.project.service.NavigationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/path")
@RequiredArgsConstructor
public class NavigationController {

    private final NavigationService navigationService;

    @GetMapping("/find")
    public ResponseEntity<List<Location>> findShortestPath(
            @RequestParam Long sourceId,
            @RequestParam Long destinationId) {
        
        List<Location> path = navigationService.findShortestPathAStar(sourceId, destinationId);
        return ResponseEntity.ok(path);
    }
}
