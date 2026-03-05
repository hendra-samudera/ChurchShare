package com.churchshare.dto;

public record ErrorResponse(
        int status,
        String error,
        String message,
        String timestamp
) {}
