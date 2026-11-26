package com.churchshare.dto;

public record DashboardStatsResponse(
        long totalSlots,
        long activeSlots,
        long slotsWithFiles,
        long totalViews
) {}
