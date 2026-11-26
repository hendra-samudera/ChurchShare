package com.churchshare.dto;

public record LoginResponse(
        String token,
        String refreshToken,
        UserInfo user
) {}
