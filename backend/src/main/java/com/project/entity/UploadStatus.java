package com.project.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "upload_status")
public class UploadStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    private String message;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum Status {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED
    }
}
