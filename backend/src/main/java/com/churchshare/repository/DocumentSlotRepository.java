package com.churchshare.repository;

import com.churchshare.entity.DocumentSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DocumentSlotRepository extends JpaRepository<DocumentSlot, Long> {
    Optional<DocumentSlot> findByChurchIdAndSlug(Long churchId, String slug);
    List<DocumentSlot> findByChurchId(Long churchId);
    List<DocumentSlot> findByChurchIdAndStatus(Long churchId, String status);
    long countByChurchId(Long churchId);
    long countByChurchIdAndStatus(Long churchId, String status);
    long countByChurchIdAndCurrentFileKeyIsNotNull(Long churchId);

    @Query("SELECT COALESCE(SUM(d.viewCount), 0) FROM DocumentSlot d WHERE d.church.id = :churchId")
    long sumViewCountByChurchId(@Param("churchId") Long churchId);
}
