package com.churchshare.service;

import com.churchshare.dto.SlotCreateRequest;
import com.churchshare.dto.SlotResponse;
import com.churchshare.dto.SlotSettingsRequest;
import com.churchshare.dto.SlotUploadResponse;
import com.churchshare.entity.AdminUser;
import com.churchshare.entity.ChurchAccount;
import com.churchshare.entity.DocumentSlot;
import com.churchshare.exception.ConflictException;
import com.churchshare.exception.InvalidFileException;
import com.churchshare.exception.ResourceNotFoundException;
import com.churchshare.exception.StorageException;
import com.churchshare.repository.DocumentSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for document slot CRUD operations with hot-swap logic.
 * 
 * This is the core service for the Permanent-Link Hot-Swap System.
 * It ensures atomic file replacement: storage write precedes DB update.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SlotService {

    private final DocumentSlotRepository slotRepository;
    private final R2StorageService storageService;

    @Value("${app.storage.max-file-size:10485760}")
    private long maxFileSize;  // Default 10MB

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    /**
     * Create a new document slot.
     * 
     * @param churchAccount The church creating the slot
     * @param request The slot creation request
     * @return The created slot response
     * @throws ConflictException if slug already exists
     */
    @Transactional
    public SlotResponse createSlot(ChurchAccount churchAccount, SlotCreateRequest request) {
        // Check for slug uniqueness within church
        if (slotRepository.existsByChurchAccountIdAndSlug(churchAccount.getId(), request.getSlug())) {
            throw ConflictException.duplicateSlug(request.getSlug());
        }

        DocumentSlot slot = DocumentSlot.builder()
                .churchAccount(churchAccount)
                .slug(request.getSlug())
                .displayTitle(request.getDisplayTitle())
                .isActive(request.getIsActive())
                .build();

        DocumentSlot savedSlot = slotRepository.save(slot);
        log.info("Created new slot: {} for church: {}", savedSlot.getSlug(), churchAccount.getName());

        return SlotResponse.fromEntity(savedSlot, baseUrl);
    }

    /**
     * Get all slots for a church.
     */
    public List<SlotResponse> getAllSlots(ChurchAccount churchAccount) {
        List<DocumentSlot> slots = slotRepository.findByChurchIdWithChurch(churchAccount.getId());
        return slots.stream()
                .map(slot -> SlotResponse.fromEntity(slot, baseUrl))
                .collect(Collectors.toList());
    }

    /**
     * Get a specific slot by slug.
     */
    public SlotResponse getSlotBySlug(ChurchAccount churchAccount, String slug) {
        DocumentSlot slot = slotRepository.findByChurchIdAndSlugWithChurch(churchAccount.getId(), slug)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", slug));
        return SlotResponse.fromEntity(slot, baseUrl);
    }

    /**
     * Get a slot for public viewing (no auth required).
     * Returns slot info even if inactive or without file.
     */
    public SlotResponse getSlotForViewer(String slug) {
        DocumentSlot slot = slotRepository.findBySlugWithChurch(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", slug));
        return SlotResponse.forViewer(slot, baseUrl);
    }

    /**
     * HOT-SWAP: Upload a new PDF file to replace the current one.
     * 
     * This is the core hot-swap operation. The sequence is:
     * 1. Validate the uploaded file
     * 2. Upload new file to storage
     * 3. Update database pointer (atomic)
     * 4. Delete old file from storage
     * 
     * @param churchAccount The church account
     * @param slug The slot slug
     * @param file The uploaded PDF file
     * @param adminUser The admin performing the upload (for audit purposes)
     * @return Upload response with new file info
     */
    @Transactional
    public SlotUploadResponse uploadFile(ChurchAccount churchAccount, String slug, 
                                          MultipartFile file, AdminUser adminUser) {
        // Find the slot
        DocumentSlot slot = slotRepository.findByChurchIdAndSlugWithChurch(churchAccount.getId(), slug)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", slug));

        // Validate file
        validatePdfFile(file);

        // Store old file key for deletion AFTER successful upload
        String oldFileKey = slot.getCurrentFileKey();

        // Generate new storage key
        String newFileKey = storageService.generateStorageKey(churchAccount.getId(), slot.getId());

        // Upload new file to storage
        try (InputStream inputStream = file.getInputStream()) {
            storageService.uploadFile(newFileKey, inputStream, file.getContentType(), file.getSize());
        } catch (IOException e) {
            throw new StorageException("Failed to read uploaded file: " + e.getMessage());
        }

        // Update database pointer (this is the hot-swap moment)
        slot.updateFile(newFileKey, file.getSize(), file.getContentType());
        DocumentSlot updatedSlot = slotRepository.save(slot);

        log.info("Hot-swap completed for slot {}: {} -> {} by user: {}", 
                slug, oldFileKey != null ? oldFileKey : "null", newFileKey, 
                adminUser != null ? adminUser.getEmail() : "unknown");

        // Delete old file from storage (do this last to avoid gap in availability)
        if (oldFileKey != null && !oldFileKey.isBlank()) {
            try {
                storageService.deleteFile(oldFileKey);
                log.debug("Deleted old file: {}", oldFileKey);
            } catch (StorageException e) {
                // Log but don't fail - old file deletion is not critical
                log.warn("Failed to delete old file {}: {}", oldFileKey, e.getMessage());
            }
        }

        return SlotUploadResponse.of(
                updatedSlot.getId(),
                updatedSlot.getSlug(),
                updatedSlot.getDisplayTitle(),
                updatedSlot.getFileSize(),
                updatedSlot.getMimeType(),
                updatedSlot.getUpdatedAt(),
                baseUrl,
                "File uploaded successfully. Permanent link unchanged."
        );
    }

    /**
     * Update slot settings (display_title, is_active).
     * Note: slug is immutable and cannot be changed.
     */
    @Transactional
    public SlotResponse updateSettings(ChurchAccount churchAccount, String slug, 
                                        SlotSettingsRequest request) {
        DocumentSlot slot = slotRepository.findByChurchIdAndSlugWithChurch(churchAccount.getId(), slug)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", slug));

        if (request.getDisplayTitle() != null) {
            slot.setDisplayTitle(request.getDisplayTitle());
        }

        if (request.getIsActive() != null) {
            if (request.getIsActive()) {
                slot.activate();
            } else {
                slot.archive();
            }
        }

        DocumentSlot updatedSlot = slotRepository.save(slot);
        log.info("Updated settings for slot: {}", slug);

        return SlotResponse.fromEntity(updatedSlot, baseUrl);
    }

    /**
     * Archive a slot (set is_active = false).
     * The slug remains reserved and the URL returns empty state.
     */
    @Transactional
    public SlotResponse archiveSlot(ChurchAccount churchAccount, String slug) {
        DocumentSlot slot = slotRepository.findByChurchIdAndSlugWithChurch(churchAccount.getId(), slug)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", slug));

        slot.archive();
        DocumentSlot archivedSlot = slotRepository.save(slot);
        log.info("Archived slot: {}", slug);

        return SlotResponse.fromEntity(archivedSlot, baseUrl);
    }

    /**
     * Reactivate an archived slot.
     */
    @Transactional
    public SlotResponse activateSlot(ChurchAccount churchAccount, String slug) {
        DocumentSlot slot = slotRepository.findByChurchIdAndSlugWithChurch(churchAccount.getId(), slug)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", slug));

        slot.activate();
        DocumentSlot activatedSlot = slotRepository.save(slot);
        log.info("Activated slot: {}", slug);

        return SlotResponse.fromEntity(activatedSlot, baseUrl);
    }

    /**
     * Delete a slot and its associated file.
     * Use with caution - this is irreversible.
     */
    @Transactional
    public void deleteSlot(ChurchAccount churchAccount, String slug) {
        DocumentSlot slot = slotRepository.findByChurchIdAndSlugWithChurch(churchAccount.getId(), slug)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", slug));

        // Delete file from storage if exists
        if (slot.getCurrentFileKey() != null) {
            try {
                storageService.deleteFile(slot.getCurrentFileKey());
            } catch (StorageException e) {
                log.warn("Failed to delete file for slot {}: {}", slug, e.getMessage());
            }
        }

        slotRepository.delete(slot);
        log.info("Deleted slot: {}", slug);
    }

    /**
     * Validate that a file is a valid PDF within size limits.
     */
    private void validatePdfFile(MultipartFile file) {
        // Check if file is empty
        if (file.isEmpty()) {
            throw InvalidFileException.empty();
        }

        // Check file size
        if (file.getSize() > maxFileSize) {
            throw InvalidFileException.tooLarge(maxFileSize);
        }

        // Check MIME type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw InvalidFileException.invalidMimeType(contentType != null ? contentType : "unknown");
        }

        // Additional PDF validation: check magic bytes
        try {
            byte[] header = file.getBytes();
            if (header.length < 4 || 
                header[0] != '%' || 
                header[1] != 'P' || 
                header[2] != 'D' || 
                header[3] != 'F') {
                throw InvalidFileException.notPdf();
            }
        } catch (IOException e) {
            throw new StorageException("Failed to validate PDF: " + e.getMessage());
        }
    }

    /**
     * Get the presigned URL for the current file in a slot.
     * Used for serving files to viewers.
     */
    public String getFileUrl(String slug) {
        DocumentSlot slot = slotRepository.findBySlugWithChurch(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", slug));

        if (!slot.hasFile()) {
            return null;
        }

        return storageService.generatePresignedUrl(slot.getCurrentFileKey());
    }
}
