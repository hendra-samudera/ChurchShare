package com.churchshare.repository;

import com.churchshare.entity.ChurchAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for ChurchAccount entities.
 */
@Repository
public interface ChurchAccountRepository extends JpaRepository<ChurchAccount, UUID> {

    /**
     * Find a church account by its subdomain.
     * Used for subdomain-based routing and identification.
     */
    Optional<ChurchAccount> findBySubdomain(String subdomain);

    /**
     * Check if a subdomain is already taken.
     */
    boolean existsBySubdomain(String subdomain);

    /**
     * Find church account by ID with admin users eagerly loaded.
     */
    @Query("SELECT c FROM ChurchAccount c LEFT JOIN FETCH c.adminUsers WHERE c.id = :id")
    Optional<ChurchAccount> findByIdWithAdminUsers(@Param("id") UUID id);

    /**
     * Find church account by ID with document slots eagerly loaded.
     */
    @Query("SELECT c FROM ChurchAccount c LEFT JOIN FETCH c.documentSlots WHERE c.id = :id")
    Optional<ChurchAccount> findByIdWithDocumentSlots(@Param("id") UUID id);
}
