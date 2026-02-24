package com.churchshare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a new document slot.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotCreateRequest {

    /**
     * The immutable slug for the permanent URL.
     * Must be lowercase letters, numbers, and hyphens only.
     * 3-60 characters.
     */
    @NotBlank(message = "Slug is required")
    @Size(min = 3, max = 60, message = "Slug must be between 3 and 60 characters")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug must contain only lowercase letters, numbers, and hyphens")
    private String slug;

    /**
     * Human-readable display title.
     */
    @Size(max = 255, message = "Display title must not exceed 255 characters")
    private String displayTitle;

    /**
     * Whether the slot should be active immediately.
     * Defaults to true.
     */
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Generate a suggested slug from a display title.
     * Example: "Sunday Liturgy" -> "sunday-liturgy"
     */
    public static String generateSlugFromTitle(String title) {
        if (title == null || title.isBlank()) {
            return null;
        }
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")  // Remove special characters
                .trim()
                .replaceAll("\\s+", "-")          // Replace spaces with hyphens
                .replaceAll("-+", "-")            // Collapse multiple hyphens
                .replaceAll("^-|-$", "");         // Remove leading/trailing hyphens
    }
}
