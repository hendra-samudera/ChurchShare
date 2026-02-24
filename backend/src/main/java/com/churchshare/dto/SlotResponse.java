package com.churchshare.dto;

import com.churchshare.entity.DocumentSlot;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for slot information responses.
 * Used for both admin and viewer-facing endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotResponse {

    private UUID id;
    private String slug;
    private String displayTitle;
    private Boolean hasFile;
    private Long fileSize;
    private String mimeType;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
    private String viewerUrl;

    /**
     * Create a SlotResponse from a DocumentSlot entity.
     * Includes the permanent viewer URL.
     */
    public static SlotResponse fromEntity(DocumentSlot slot, String baseUrl) {
        return SlotResponse.builder()
                .id(slot.getId())
                .slug(slot.getSlug())
                .displayTitle(slot.getDisplayTitle())
                .hasFile(slot.hasFile())
                .fileSize(slot.getFileSize())
                .mimeType(slot.getMimeType())
                .isActive(slot.getIsActive())
                .createdAt(slot.getCreatedAt())
                .updatedAt(slot.getUpdatedAt())
                .viewerUrl(baseUrl + "/view/" + slot.getSlug())
                .build();
    }

    /**
     * Create a minimal SlotResponse for viewer-facing meta endpoint.
     * Excludes sensitive information.
     */
    public static SlotResponse forViewer(DocumentSlot slot, String baseUrl) {
        return SlotResponse.builder()
                .id(slot.getId())
                .slug(slot.getSlug())
                .displayTitle(slot.getDisplayTitle() != null ? slot.getDisplayTitle() : "Document")
                .hasFile(slot.hasFile())
                .fileSize(slot.getFileSize())
                .mimeType(slot.getMimeType())
                .isActive(slot.getIsActive())
                .updatedAt(slot.getUpdatedAt())
                .viewerUrl(baseUrl + "/view/" + slot.getSlug())
                .build();
    }
}
