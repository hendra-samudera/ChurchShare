package com.churchshare.repository;

import com.churchshare.entity.UploadAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UploadAuditRepository extends JpaRepository<UploadAudit, Long> {
    List<UploadAudit> findBySlotId(Long slotId);
}
