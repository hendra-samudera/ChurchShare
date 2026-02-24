package com.churchshare.security;

import com.churchshare.entity.AdminUser;
import com.churchshare.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Custom UserDetailsService implementation for Spring Security.
 * Loads admin users by email for authentication.
 */
@Service
@RequiredArgsConstructor
public class ChurchShareUserDetailsService implements UserDetailsService {

    private final AdminUserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        AdminUser user = userRepository.findByEmailWithChurch(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (!user.getIsActive()) {
            throw new UsernameNotFoundException("User account is inactive: " + email);
        }

        return ChurchShareUserDetails.fromEntity(user);
    }

    /**
     * Load user by email (convenience method).
     */
    public ChurchShareUserDetails loadUserByEmail(String email) {
        return (ChurchShareUserDetails) loadUserByUsername(email);
    }
}
