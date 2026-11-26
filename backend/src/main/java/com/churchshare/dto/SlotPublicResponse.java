package com.churchshare.dto;

public record SlotPublicResponse(
        String slug,
        String displayTitle,
        String status,
        boolean hasFile,
        String category
) {}
