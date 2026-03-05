package com.churchshare.repository;

import com.churchshare.entity.SlotFileVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SlotFileVersionRepository extends JpaRepository<SlotFileVersion, Long> {
    List<SlotFileVersion> findBySlotId(Long slotId);
}
