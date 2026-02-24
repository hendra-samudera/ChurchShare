package com.churchshare.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * ChurchAccount entity represents a church organization in the system.
 * Each church has its own isolated set of document slots and admin users.
 */
@Entity
@Table(name = "church_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChurchAccount {

    @Id
    @Column(columnDefinition = "UUID")
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 63)
    private String subdomain;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "churchAccount", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<AdminUser> adminUsers = new HashSet<>();

    @OneToMany(mappedBy = "churchAccount", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<DocumentSlot> documentSlots = new HashSet<>();

    /**
     * Convenience method to add an admin user to this church.
     */
    public void addAdminUser(AdminUser adminUser) {
        this.adminUsers.add(adminUser);
        adminUser.setChurchAccount(this);
    }

    /**
     * Convenience method to remove an admin user from this church.
     */
    public void removeAdminUser(AdminUser adminUser) {
        this.adminUsers.remove(adminUser);
        adminUser.setChurchAccount(null);
    }

    /**
     * Convenience method to add a document slot to this church.
     */
    public void addDocumentSlot(DocumentSlot documentSlot) {
        this.documentSlots.add(documentSlot);
        documentSlot.setChurchAccount(this);
    }

    /**
     * Convenience method to remove a document slot from this church.
     */
    public void removeDocumentSlot(DocumentSlot documentSlot) {
        this.documentSlots.remove(documentSlot);
        documentSlot.setChurchAccount(null);
    }
}
