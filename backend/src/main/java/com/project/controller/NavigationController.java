package com.project.controller;

import com.project.dto.NavigationResponseDto;
import com.project.service.NavigationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NavigationController {

    private final NavigationService navigationService;

    @GetMapping("/path/find")
    public ResponseEntity<NavigationResponseDto> findShortestPath(
            @RequestParam Long sourceId,
            @RequestParam Long destinationId,
            @RequestParam(defaultValue = "false") boolean wheelchairAccessible) {
        
        NavigationResponseDto response = navigationService.getNavigationRoute(sourceId, destinationId, wheelchairAccessible);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/shortest-path")
    public ResponseEntity<NavigationResponseDto> getShortestPath(@RequestBody ShortestPathRequest request) {
        NavigationResponseDto response = navigationService.getNavigationRoute(
                request.getSourceId(), 
                request.getDestinationId(), 
                request.isWheelchairAccessible()
        );
        return ResponseEntity.ok(response);
    }

    @Data
    public static class ShortestPathRequest {
        private Long sourceId;
        private Long destinationId;
        private boolean wheelchairAccessible;
    }
}
