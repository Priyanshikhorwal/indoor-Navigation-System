package com.project.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.project.service.CadProcessingService;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/admin/cad")
@PreAuthorize("hasRole('ADMIN')")
public class CadController {

    private final CadProcessingService cadProcessingService;

    @Autowired
    public CadController(CadProcessingService cadProcessingService) {
        this.cadProcessingService = cadProcessingService;
    }

    /**
     * Upload a CAD/DXF file. Returns an uploadId that can be used to poll status.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadCad(@RequestParam("file") MultipartFile file) {
        String uploadId = cadProcessingService.handleUpload(file);
        return ResponseEntity.ok().body(java.util.Collections.singletonMap("uploadId", uploadId));
    }

    /**
     * Get processing status for a given uploadId.
     */
    @GetMapping("/status/{uploadId}")
    public ResponseEntity<?> getStatus(@PathVariable String uploadId) {
        return ResponseEntity.ok(cadProcessingService.getStatus(uploadId));
    }
}
