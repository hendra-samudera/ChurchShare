package com.churchshare.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "document_slot")
@Getter
@Setter
@NoArgsConstructor
public class DocumentSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "church_id")
    private Church church;

    @Column(nullable = false, length = 100)
    private String slug;

    @Column(name = "display_title", length = 255)
    private String displayTitle;

    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'ACTIVE'")
    private String status = "ACTIVE";

    @Column(name = "current_file_key", length = 512)
    private String currentFileKey;

    @Column(name = "current_uploaded_at")
    private Instant currentUploadedAt;

    @Column(name = "current_file_size_bytes")
    private Long currentFileSizeBytes;

    @Column(nullable = false, length = 50, columnDefinition = "VARCHAR(50) DEFAULT 'Announcements'")
    private String category = "Announcements";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "view_count", nullable = false, columnDefinition = "BIGINT DEFAULT 0")
    private Long viewCount = 0L;

    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
