package com.churchshare.security;

import com.churchshare.entity.AdminUser;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

/**
 * Custom UserDetails implementation for AdminUser.
 * Wraps the AdminUser entity for Spring Security integration.
 */
@Getter
public class ChurchShareUserDetails implements UserDetails {

    private final UUID id;
    private final UUID churchId;
    private final String email;
    private final String password;
    private final String displayName;
    private final String role;
    private final boolean isActive;
    private final Collection<? extends GrantedAuthority> authorities;

    public ChurchShareUserDetails(AdminUser user) {
        this.id = user.getId();
        this.churchId = user.getChurchAccount().getId();
        this.email = user.getEmail();
        this.password = user.getPasswordHash();
        this.displayName = user.getDisplayName();
        this.role = user.getRole().name();
        this.isActive = user.getIsActive();
        this.authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return isActive;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive;
    }

    /**
     * Create from AdminUser entity.
     */
    public static ChurchShareUserDetails fromEntity(AdminUser user) {
        return new ChurchShareUserDetails(user);
    }
}
