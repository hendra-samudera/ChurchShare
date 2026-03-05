package com.churchshare.service;

import com.churchshare.dto.SlotResponse;
import com.churchshare.entity.AdminUser;
import com.churchshare.entity.DocumentSlot;
import com.churchshare.entity.SlotFileVersion;
import com.churchshare.entity.UploadAudit;
import com.churchshare.repository.AdminUserRepository;
import com.churchshare.repository.DocumentSlotRepository;
import com.churchshare.repository.SlotFileVersionRepository;
import com.churchshare.repository.UploadAuditRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String ALLOWED_CONTENT_TYPE = "application/pdf";

    private final StorageService storageService;
    private final DocumentSlotRepository documentSlotRepository;
    private final SlotFileVersionRepository slotFileVersionRepository;
    private final UploadAuditRepository uploadAuditRepository;
    private final AdminUserRepository adminUserRepository;
    private final SlotService slotService;

    @Transactional
    public SlotResponse uploadFile(Long slotId, Long adminUserId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }
        if (!ALLOWED_CONTENT_TYPE.equals(file.getContentType())) {
            throw new IllegalArgumentException("Only PDF files are allowed");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size must not exceed 10MB");
        }

        DocumentSlot slot = documentSlotRepository.findById(slotId)
                .orElseThrow(() -> new EntityNotFoundException("Slot not found with id: " + slotId));

        AdminUser adminUser = adminUserRepository.findById(adminUserId)
                .orElseThrow(() -> new EntityNotFoundException("Admin user not found with id: " + adminUserId));

        try {
            byte[] fileBytes = file.getBytes();
            String storageKey = "slots/" + slotId + "/" + UUID.randomUUID() + ".pdf";
            String sha256Hash = computeSha256(fileBytes);

            storageService.uploadFile(storageKey, fileBytes, ALLOWED_CONTENT_TYPE);

            SlotFileVersion version = new SlotFileVersion();
            version.setSlot(slot);
            version.setStorageKey(storageKey);
            version.setOriginalFilename(file.getOriginalFilename());
            version.setContentType(ALLOWED_CONTENT_TYPE);
            version.setFileSizeBytes(file.getSize());
            version.setSha256Hash(sha256Hash);
            version.setUploadedBy(adminUser);
            slotFileVersionRepository.save(version);

            String oldFileKey = slot.getCurrentFileKey();
            String action = oldFileKey != null ? "REPLACE" : "UPLOAD";

            slot.setCurrentFileKey(storageKey);
            slot.setCurrentUploadedAt(Instant.now());
            slot.setCurrentFileSizeBytes(file.getSize());
            slot.setOriginalFilename(file.getOriginalFilename());
            documentSlotRepository.save(slot);

            UploadAudit audit = new UploadAudit();
            audit.setSlot(slot);
            audit.setAdminUser(adminUser);
            audit.setAction(action);
            audit.setOldFileKey(oldFileKey);
            audit.setNewFileKey(storageKey);
            uploadAuditRepository.save(audit);

            log.info("File uploaded for slot {}: {} (action={})", slotId, storageKey, action);

            return slotService.mapToResponse(slot);

        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded file", e);
        }
    }

    private String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
