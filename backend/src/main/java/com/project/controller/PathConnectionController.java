package com.project.controller;

import com.project.dto.PathConnectionDto;
import com.project.entity.PathConnection;
import com.project.service.PathConnectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/connections")
@RequiredArgsConstructor
public class PathConnectionController {

    private final PathConnectionService pathConnectionService;

    @GetMapping
    public ResponseEntity<List<PathConnection>> getAllConnections() {
        return ResponseEntity.ok(pathConnectionService.getAllConnections());
    }

    @PostMapping
    public ResponseEntity<PathConnection> createConnection(@Valid @RequestBody PathConnectionDto dto) {
        return ResponseEntity.ok(pathConnectionService.createConnection(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConnection(@PathVariable Long id) {
        pathConnectionService.deleteConnection(id);
        return ResponseEntity.ok().build();
    }
}
