package com.churchshare.controller;

import com.churchshare.dto.LoginRequest;
import com.churchshare.dto.LoginResponse;
import com.churchshare.security.ChurchShareUserDetails;
import com.churchshare.service.AdminUserService;
import com.churchshare.service.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for authentication endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AdminUserService adminUserService;
    private final JwtService jwtService;

    /**
     * Authenticate an admin user and return JWT token.
     * 
     * POST /api/auth/login
     * Body: { "email": "...", "password": "..." }
     * Response: { "token": "...", "expiresIn": ..., "user": {...} }
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());
        LoginResponse response = adminUserService.authenticate(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get current authenticated user info.
     * 
     * GET /api/auth/me
     * Headers: Authorization: Bearer <token>
     */
    @GetMapping("/me")
    public ResponseEntity<LoginResponse> getCurrentUser(
            @AuthenticationPrincipal ChurchShareUserDetails userDetails) {
        
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        LoginResponse response = LoginResponse.builder()
                .userId(userDetails.getId())
                .email(userDetails.getEmail())
                .displayName(userDetails.getDisplayName())
                .role(userDetails.getRole())
                .churchId(userDetails.getChurchId())
                .build();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Logout endpoint (client-side token removal).
     * 
     * POST /api/auth/logout
     * Headers: Authorization: Bearer <token>
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // In a stateless JWT system, logout is handled client-side
        // by removing the token from storage
        log.debug("Logout requested");
        return ResponseEntity.ok().build();
    }
}
