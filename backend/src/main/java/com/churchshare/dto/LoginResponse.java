package com.churchshare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for login responses containing JWT token and user info.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String tokenType;
    private long expiresIn;
    private UUID userId;
    private String email;
    private String displayName;
    private String role;
    private UUID churchId;
    private String churchName;
    private Instant issuedAt;
    private Instant expiresAt;

    public static LoginResponse of(String token, long expiresIn, 
                                   UUID userId, String email, String displayName,
                                   String role, UUID churchId, String churchName) {
        Instant now = Instant.now();
        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(expiresIn)
                .userId(userId)
                .email(email)
                .displayName(displayName)
                .role(role)
                .churchId(churchId)
                .churchName(churchName)
                .issuedAt(now)
                .expiresAt(now.plusMillis(expiresIn))
                .build();
    }
}
