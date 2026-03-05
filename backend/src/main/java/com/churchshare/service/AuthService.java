package com.churchshare.service;

import com.churchshare.dto.LoginRequest;
import com.churchshare.dto.LoginResponse;
import com.churchshare.dto.UserInfo;
import com.churchshare.entity.AdminUser;
import com.churchshare.repository.AdminUserRepository;
import com.churchshare.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AdminUserRepository adminUserRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        AdminUser user = adminUserRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.email()));

        String token = jwtTokenProvider.generateToken(user.getEmail());

        user.setLastLoginAt(Instant.now());
        adminUserRepository.save(user);

        UserInfo userInfo = new UserInfo(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                "Administrator",
                buildAvatarInitials(user.getDisplayName())
        );

        return new LoginResponse(token, null, userInfo);
    }

    private String buildAvatarInitials(String displayName) {
        if (displayName == null || displayName.isBlank()) {
            return "";
        }
        return Arrays.stream(displayName.trim().split("\\s+"))
                .filter(word -> !word.isEmpty())
                .map(word -> word.substring(0, 1).toUpperCase())
                .collect(Collectors.joining());
    }
}
