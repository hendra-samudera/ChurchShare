package com.churchshare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for file upload responses.
 * Returned after a successful hot-swap upload.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotUploadResponse {

    private UUID slotId;
    private String slug;
    private String displayTitle;
    private String viewerUrl;
    private Long fileSize;
    private String mimeType;
    private Instant uploadedAt;
    private String message;

    /**
     * Create a success response from entity data.
     */
    public static SlotUploadResponse of(UUID slotId, String slug, String displayTitle,
                                        Long fileSize, String mimeType, Instant updatedAt,
                                        String baseUrl, String message) {
        return SlotUploadResponse.builder()
                .slotId(slotId)
                .slug(slug)
                .displayTitle(displayTitle)
                .viewerUrl(baseUrl + "/view/" + slug)
                .fileSize(fileSize)
                .mimeType(mimeType)
                .uploadedAt(updatedAt)
                .message(message)
                .build();
    }
}
