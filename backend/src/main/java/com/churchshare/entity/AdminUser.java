package com.churchshare.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * AdminUser entity represents an administrator user for a church.
 * Admin users can manage document slots and upload files.
 */
@Entity
@Table(name = "admin_users", 
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"church_id", "email"})
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUser {

    @Id
    @Column(columnDefinition = "UUID")
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "church_id", nullable = false)
    private ChurchAccount churchAccount;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.ADMIN;

    @Column(name = "display_name", length = 255)
    private String displayName;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Role enumeration for admin users.
     */
    public enum Role {
        SUPER_ADMIN,  // Can manage church account settings
        ADMIN,        // Can manage document slots
        EDITOR        // Can only upload/replace files
    }

    /**
     * Check if this user has at least the specified role level.
     */
    public boolean hasRoleAtLeast(Role requiredRole) {
        return this.role.ordinal() <= requiredRole.ordinal();
    }

    /**
     * Get the full display name, falling back to email if not set.
     */
    public String getDisplayNameOrEmail() {
        return displayName != null && !displayName.isBlank() ? displayName : email;
    }
}
