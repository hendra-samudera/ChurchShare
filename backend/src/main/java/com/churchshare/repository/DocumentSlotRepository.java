package com.churchshare.repository;

import com.churchshare.entity.DocumentSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for DocumentSlot entities.
 * This is the core repository for the Permanent-Link Hot-Swap System.
 */
@Repository
public interface DocumentSlotRepository extends JpaRepository<DocumentSlot, UUID> {

    /**
     * Find a slot by its slug within a specific church.
     * This is the primary lookup method for viewer-facing URLs.
     */
    Optional<DocumentSlot> findByChurchAccountIdAndSlug(UUID churchId, String slug);

    /**
     * Find a slot by slug (across all churches).
     * Use with caution - should typically include church context.
     */
    Optional<DocumentSlot> findBySlug(String slug);

    /**
     * Check if a slug is already taken within a church.
     */
    boolean existsByChurchAccountIdAndSlug(UUID churchId, String slug);

    /**
     * Find all slots for a specific church, ordered by creation date.
     */
    List<DocumentSlot> findByChurchAccountIdOrderByCreatedAtDesc(UUID churchId);

    /**
     * Find all active slots for a specific church.
     */
    List<DocumentSlot> findByChurchAccountIdAndIsActiveTrueOrderByCreatedAtDesc(UUID churchId);

    /**
     * Find all slots for a church that have a file uploaded.
     */
    List<DocumentSlot> findByChurchAccountIdAndCurrentFileKeyIsNotNull(UUID churchId);

    /**
     * Count slots for a specific church.
     */
    long countByChurchAccountId(UUID churchId);

    /**
     * Count active slots for a specific church.
     */
    long countByChurchAccountIdAndIsActiveTrue(UUID churchId);

    /**
     * Find slot by slug with church account eagerly loaded.
     * Used for viewer-facing lookups.
     */
    @Query("SELECT s FROM DocumentSlot s LEFT JOIN FETCH s.churchAccount WHERE s.slug = :slug")
    Optional<DocumentSlot> findBySlugWithChurch(@Param("slug") String slug);

    /**
     * Find slot by church and slug with eager loading.
     */
    @Query("SELECT s FROM DocumentSlot s LEFT JOIN FETCH s.churchAccount WHERE s.churchAccount.id = :churchId AND s.slug = :slug")
    Optional<DocumentSlot> findByChurchIdAndSlugWithChurch(@Param("churchId") UUID churchId, @Param("slug") String slug);

    /**
     * Find all slots for a church with eager loading.
     */
    @Query("SELECT s FROM DocumentSlot s LEFT JOIN FETCH s.churchAccount WHERE s.churchAccount.id = :churchId ORDER BY s.createdAt DESC")
    List<DocumentSlot> findByChurchIdWithChurch(@Param("churchId") UUID churchId);
}
