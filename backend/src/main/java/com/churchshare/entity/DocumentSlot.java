package com.churchshare.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * DocumentSlot entity represents a permanent-link slot for document sharing.
 * 
 * This is the core entity for the Hot-Swap System:
 * - The slug is immutable and forms the permanent URL
 * - The currentFileKey points to the active file in object storage
 * - When a new file is uploaded, only the pointer changes
 */
@Entity
@Table(name = "document_slots",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"church_id", "slug"})
       },
       indexes = {
           @Index(name = "idx_document_slots_slug", columnList = "slug"),
           @Index(name = "idx_document_slots_church_id", columnList = "church_id"),
           @Index(name = "idx_document_slots_church_slug", columnList = "church_id, slug"),
           @Index(name = "idx_document_slots_is_active", columnList = "is_active")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentSlot {

    @Id
    @Column(columnDefinition = "UUID")
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "church_id", nullable = false)
    private ChurchAccount churchAccount;

    /**
     * The immutable slug that forms the permanent URL.
     * Must be unique within the church's account.
     * Format: lowercase letters, numbers, and hyphens only.
     */
    @Column(nullable = false, length = 60)
    private String slug;

    /**
     * Human-readable title displayed to viewers.
     * Can be null if not set by the admin.
     */
    @Column(name = "display_title", length = 255)
    private String displayTitle;

    /**
     * Pointer to the current active file in object storage.
     * Format: churches/{church_id}/slots/{slot_id}/{uuid}.pdf
     * 
     * When null, the slot is in an empty state (no file uploaded yet).
     */
    @Column(name = "current_file_key", length = 512)
    private String currentFileKey;

    /**
     * Size of the current file in bytes.
     */
    @Column(name = "file_size")
    private Long fileSize;

    /**
     * MIME type of the current file.
     * Expected to be "application/pdf" for v1.0.
     */
    @Column(name = "mime_type", length = 100)
    private String mimeType;

    /**
     * Active status. When false, the slot returns a friendly empty state.
     * This allows graceful deactivation without deleting the slot.
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Check if this slot has a file available.
     */
    public boolean hasFile() {
        return isActive && currentFileKey != null && !currentFileKey.isBlank();
    }

    /**
     * Generate the storage key for a new file upload.
     * Format: churches/{church_id}/slots/{slot_id}/{unique_id}.pdf
     */
    public String generateStorageKey(UUID uniqueId) {
        return String.format("churches/%s/slots/%s/%s.pdf",
                churchAccount.getId(),
                id,
                uniqueId);
    }

    /**
     * Update the file pointer after a successful upload.
     * This is the core of the hot-swap mechanism.
     */
    public void updateFile(String newFileKey, Long fileSize, String mimeType) {
        this.currentFileKey = newFileKey;
        this.fileSize = fileSize;
        this.mimeType = mimeType;
        this.updatedAt = Instant.now();
    }

    /**
     * Clear the file pointer (e.g., when file is deleted).
     */
    public void clearFile() {
        this.currentFileKey = null;
        this.fileSize = null;
        this.mimeType = null;
        this.updatedAt = Instant.now();
    }

    /**
     * Archive this slot (set is_active to false).
     * The slug remains reserved and the URL returns empty state.
     */
    public void archive() {
        this.isActive = false;
        this.updatedAt = Instant.now();
    }

    /**
     * Reactivate this slot.
     */
    public void activate() {
        this.isActive = true;
        this.updatedAt = Instant.now();
    }
}
