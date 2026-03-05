package com.churchshare.dto;

public record UpdateSlotRequest(
        String displayName,
        String category,
        String description,
        String status
) {}
