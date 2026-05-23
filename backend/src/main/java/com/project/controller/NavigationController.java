package com.project.controller;

import com.project.dto.NavigationResponseDto;
import com.project.dto.NavigationTokenResponse;
import com.project.service.NavigationService;
import com.project.service.NavigationTokenService;
import com.project.repository.NodeRepository;
import io.jsonwebtoken.Claims;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NavigationController {

    private final NavigationService navigationService;
    private final NavigationTokenService tokenService;
    private final NodeRepository nodeRepository;

    @GetMapping("/navigation/validate-token")
    public ResponseEntity<NavigationTokenResponse> validateToken(@RequestParam String token) {
        try {
            if (tokenService.isTokenExpired(token)) {
                return ResponseEntity.ok(NavigationTokenResponse.builder()
                        .valid(false)
                        .error("Token has expired")
                        .build());
            }

            Claims claims = tokenService.extractAllClaims(token);
            Number bldgNum = claims.get("buildingId", Number.class);
            Long buildingId = bldgNum != null ? bldgNum.longValue() : null;

            Number destNum = claims.get("destination", Number.class);
            Long destinationId = destNum != null ? destNum.longValue() : null;

            Number startNum = claims.get("start", Number.class);
            Long startId = startNum != null ? startNum.longValue() : null;

            String startName = "Main Entrance";
            if (startId != null) {
                startName = nodeRepository.findById(startId)
                        .map(node -> node.getRoom() != null ? node.getRoom().getName() : "Entrance Point")
                        .orElse("Entrance Point");
            }

            String destName = "Destination";
            if (destinationId != null) {
                destName = nodeRepository.findById(destinationId)
                        .map(node -> node.getRoom() != null ? node.getRoom().getName() : "Room Point")
                        .orElse("Room Point");
            }

            return ResponseEntity.ok(NavigationTokenResponse.builder()
                    .valid(true)
                    .buildingId(buildingId)
                    .start(startName)
                    .destination(destName)
                    .startNodeId(startId)
                    .destinationNodeId(destinationId)
                    .build());

        } catch (Exception e) {
            return ResponseEntity.ok(NavigationTokenResponse.builder()
                    .valid(false)
                    .error("Invalid, expired, or malformed token")
                    .build());
        }
    }

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
