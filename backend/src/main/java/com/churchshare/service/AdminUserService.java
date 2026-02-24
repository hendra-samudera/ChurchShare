package com.churchshare.service;

import com.churchshare.dto.LoginRequest;
import com.churchshare.dto.LoginResponse;
import com.churchshare.entity.AdminUser;
import com.churchshare.entity.ChurchAccount;
import com.churchshare.exception.AuthenticationException;
import com.churchshare.exception.ConflictException;
import com.churchshare.exception.ResourceNotFoundException;
import com.churchshare.repository.AdminUserRepository;
import com.churchshare.repository.ChurchAccountRepository;
import com.churchshare.security.ChurchShareUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for admin user authentication and management.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final AdminUserRepository userRepository;
    private final ChurchAccountRepository churchRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Authenticate an admin user and return JWT token.
     */
    @Transactional(readOnly = true)
    public LoginResponse authenticate(LoginRequest request) {
        // Find user by email
        AdminUser user = userRepository.findByEmailWithChurch(request.getEmail())
                .orElseThrow(AuthenticationException::invalidCredentials);

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw AuthenticationException.invalidCredentials();
        }

        // Check if user is active
        if (!user.getIsActive()) {
            throw AuthenticationException.userInactive();
        }

        // Generate JWT token
        String token = jwtService.generateToken(user);

        log.info("User authenticated: {} (church: {})", user.getEmail(), user.getChurchAccount().getName());

        return LoginResponse.of(
                token,
                jwtService.getExpirationMs(),
                user.getId(),
                user.getEmail(),
                user.getDisplayNameOrEmail(),
                user.getRole().name(),
                user.getChurchAccount().getId(),
                user.getChurchAccount().getName()
        );
    }

    /**
     * Get the current authenticated user.
     */
    public AdminUser getCurrentUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));
    }

    /**
     * Get user details for Spring Security.
     */
    public ChurchShareUserDetails getUserDetails(String email) {
        AdminUser user = userRepository.findByEmailWithChurch(email)
                .orElseThrow(() -> new AuthenticationException("User not found: " + email));
        return ChurchShareUserDetails.fromEntity(user);
    }

    /**
     * Get all admin users for a church.
     */
    public List<AdminUser> getUsersForChurch(UUID churchId) {
        return userRepository.findByChurchIdWithChurch(churchId);
    }

    /**
     * Create a new admin user.
     */
    @Transactional
    public AdminUser createUser(UUID churchId, String email, String password, 
                                 String displayName, AdminUser.Role role) {
        ChurchAccount church = churchRepository.findById(churchId)
                .orElseThrow(() -> new ResourceNotFoundException("Church", churchId.toString()));

        // Check for email uniqueness within church
        if (userRepository.existsByChurchAccountAndEmail(church, email)) {
            throw ConflictException.duplicateEmail(email);
        }

        AdminUser user = AdminUser.builder()
                .churchAccount(church)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .displayName(displayName)
                .role(role != null ? role : AdminUser.Role.ADMIN)
                .isActive(true)
                .build();

        AdminUser savedUser = userRepository.save(user);
        log.info("Created new admin user: {} for church: {}", email, church.getName());

        return savedUser;
    }

    /**
     * Update user display name.
     */
    @Transactional
    public AdminUser updateDisplayName(UUID userId, String displayName) {
        AdminUser user = getCurrentUser(userId);
        user.setDisplayName(displayName);
        return userRepository.save(user);
    }

    /**
     * Change user password.
     */
    @Transactional
    public void changePassword(UUID userId, String oldPassword, String newPassword) {
        AdminUser user = getCurrentUser(userId);

        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new AuthenticationException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password changed for user: {}", user.getEmail());
    }

    /**
     * Deactivate a user (soft delete).
     */
    @Transactional
    public AdminUser deactivateUser(UUID userId) {
        AdminUser user = getCurrentUser(userId);
        user.setIsActive(false);
        return userRepository.save(user);
    }

    /**
     * Reactivate a user.
     */
    @Transactional
    public AdminUser activateUser(UUID userId) {
        AdminUser user = getCurrentUser(userId);
        user.setIsActive(true);
        return userRepository.save(user);
    }

    /**
     * Delete a user permanently.
     * Use with caution.
     */
    @Transactional
    public void deleteUser(UUID userId) {
        AdminUser user = getCurrentUser(userId);
        userRepository.delete(user);
        log.info("Deleted user: {}", user.getEmail());
    }

    /**
     * Find user by email.
     */
    public AdminUser findByEmail(String email) {
        return userRepository.findByEmailWithChurch(email).orElse(null);
    }
}
