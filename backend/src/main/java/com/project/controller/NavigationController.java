package com.project.controller;

import com.project.dto.NavigationResponseDto;
import com.project.service.NavigationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/path")
@RequiredArgsConstructor
public class NavigationController {

    private final NavigationService navigationService;

    @GetMapping("/find")
    public ResponseEntity<NavigationResponseDto> findShortestPath(
            @RequestParam Long sourceId,
            @RequestParam Long destinationId,
            @RequestParam(defaultValue = "false") boolean wheelchairAccessible) {
        
        NavigationResponseDto response = navigationService.getNavigationRoute(sourceId, destinationId, wheelchairAccessible);
        return ResponseEntity.ok(response);
    }
}
