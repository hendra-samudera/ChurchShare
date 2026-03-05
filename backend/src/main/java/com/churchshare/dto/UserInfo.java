package com.churchshare.dto;

public record UserInfo(
        Long id,
        String email,
        String displayName,
        String role,
        String avatarInitials
) {}
