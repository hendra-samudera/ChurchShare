package com.churchshare.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating slot settings (display_title, is_active).
 * Does NOT allow changing the slug (immutable).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotSettingsRequest {

    /**
     * Human-readable display title.
     * Can be null to clear the title.
     */
    @Size(max = 255, message = "Display title must not exceed 255 characters")
    private String displayTitle;

    /**
     * Whether the slot should be active.
     * When false, the slot returns a friendly empty state.
     */
    private Boolean isActive;
}
