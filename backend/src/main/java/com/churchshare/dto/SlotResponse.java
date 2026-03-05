package com.churchshare.dto;

public record SlotResponse(
        String id,
        String displayName,
        String slug,
        String permanentUrl,
        String lastUpdatedAt,
        String lastUpdatedBy,
        boolean isActive,
        boolean hasFile,
        Long fileSize,
        String originalFilename,
        String category,
        String description,
        String status,
        Long viewCount
) {}
