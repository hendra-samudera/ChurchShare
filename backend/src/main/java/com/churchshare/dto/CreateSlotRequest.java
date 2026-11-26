package com.churchshare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateSlotRequest(
        @NotBlank String displayName,
        @NotBlank @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$") String slug,
        String category,
        String description,
        String status
) {}
