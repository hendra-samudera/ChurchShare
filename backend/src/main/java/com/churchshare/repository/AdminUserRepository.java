package com.churchshare.repository;

import com.churchshare.entity.AdminUser;
import com.churchshare.entity.ChurchAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for AdminUser entities.
 */
@Repository
public interface AdminUserRepository extends JpaRepository<AdminUser, UUID> {

    /**
     * Find an admin user by email within a specific church.
     * Used for authentication.
     */
    Optional<AdminUser> findByChurchAccountAndEmail(ChurchAccount churchAccount, String email);

    /**
     * Find an admin user by email (across all churches).
     * Use with caution - should typically include church context.
     */
    Optional<AdminUser> findByEmail(String email);

    /**
     * Check if an email is already taken within a church.
     */
    boolean existsByChurchAccountAndEmail(ChurchAccount churchAccount, String email);

    /**
     * Find all admin users for a specific church.
     */
    List<AdminUser> findByChurchAccountId(UUID churchId);

    /**
     * Find all active admin users for a specific church.
     */
    List<AdminUser> findByChurchAccountIdAndIsActiveTrue(UUID churchId);

    /**
     * Count admin users for a specific church.
     */
    long countByChurchAccountId(UUID churchId);

    /**
     * Find admin user by email with church account eagerly loaded.
     */
    @Query("SELECT a FROM AdminUser a LEFT JOIN FETCH a.churchAccount WHERE a.email = :email")
    Optional<AdminUser> findByEmailWithChurch(@Param("email") String email);

    /**
     * Find all admin users for a church with eager loading.
     */
    @Query("SELECT a FROM AdminUser a LEFT JOIN FETCH a.churchAccount WHERE a.churchAccount.id = :churchId")
    List<AdminUser> findByChurchIdWithChurch(@Param("churchId") UUID churchId);
}
