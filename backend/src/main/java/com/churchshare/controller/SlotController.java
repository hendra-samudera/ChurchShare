package com.churchshare.controller;

import com.churchshare.dto.SlotCreateRequest;
import com.churchshare.dto.SlotResponse;
import com.churchshare.dto.SlotSettingsRequest;
import com.churchshare.dto.SlotUploadResponse;
import com.churchshare.entity.AdminUser;
import com.churchshare.entity.ChurchAccount;
import com.churchshare.repository.ChurchAccountRepository;
import com.churchshare.security.ChurchShareUserDetails;
import com.churchshare.service.SlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Controller for admin slot management endpoints.
 * 
 * All endpoints require authentication.
 */
@Slf4j
@RestController
@RequestMapping("/api/slots")
@RequiredArgsConstructor
public class SlotController {

    private final SlotService slotService;
    private final ChurchAccountRepository churchRepository;

    /**
     * Get the church account for the authenticated user.
     */
    private ChurchAccount getChurchAccount(ChurchShareUserDetails userDetails) {
        return churchRepository.findById(userDetails.getChurchId())
                .orElseThrow(() -> new IllegalStateException("Church not found"));
    }

    /**
     * List all slots for the authenticated church.
     * 
     * GET /api/slots
     * Headers: Authorization: Bearer <token>
     */
    @GetMapping
    public ResponseEntity<List<SlotResponse>> getAllSlots(
            @AuthenticationPrincipal ChurchShareUserDetails userDetails) {
        
        ChurchAccount church = getChurchAccount(userDetails);
        List<SlotResponse> slots = slotService.getAllSlots(church);
        log.info("Retrieved {} slots for church: {}", slots.size(), church.getName());
        return ResponseEntity.ok(slots);
    }

    /**
     * Create a new slot.
     * 
     * POST /api/slots
     * Headers: Authorization: Bearer <token>
     * Body: { "slug": "my-slug", "displayTitle": "My Title", "isActive": true }
     */
    @PostMapping
    public ResponseEntity<SlotResponse> createSlot(
            @Valid @RequestBody SlotCreateRequest request,
            @AuthenticationPrincipal ChurchShareUserDetails userDetails) {
        
        ChurchAccount church = getChurchAccount(userDetails);
        SlotResponse response = slotService.createSlot(church, request);
        log.info("Created slot '{}' for church: {}", request.getSlug(), church.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Get a specific slot by slug.
     * 
     * GET /api/slots/{slug}
     * Headers: Authorization: Bearer <token>
     */
    @GetMapping("/{slug}")
    public ResponseEntity<SlotResponse> getSlot(
            @PathVariable String slug,
            @AuthenticationPrincipal ChurchShareUserDetails userDetails) {
        
        ChurchAccount church = getChurchAccount(userDetails);
        SlotResponse response = slotService.getSlotBySlug(church, slug);
        return ResponseEntity.ok(response);
    }

    /**
     * HOT-SWAP: Upload a new PDF file to replace the current one.
     * 
     * PATCH /api/slots/{slug}/file
     * Headers: Authorization: Bearer <token>
     * Content-Type: multipart/form-data
     * Body: file (PDF)
     * 
     * This is the core hot-swap endpoint. The sequence is:
     * 1. Validate the uploaded file (PDF, < 20MB)
     * 2. Upload new file to storage
     * 3. Update database pointer (atomic)
     * 4. Delete old file from storage
     */
    @PatchMapping("/{slug}/file")
    public ResponseEntity<SlotUploadResponse> uploadFile(
            @PathVariable String slug,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal ChurchShareUserDetails userDetails) {
        
        ChurchAccount church = getChurchAccount(userDetails);
        AdminUser adminUser = new AdminUser();
        adminUser.setId(userDetails.getId());
        adminUser.setEmail(userDetails.getEmail());
        
        SlotUploadResponse response = slotService.uploadFile(church, slug, file, adminUser);
        log.info("File uploaded to slot '{}' by user: {}", slug, userDetails.getEmail());
        return ResponseEntity.ok(response);
    }

    /**
     * Update slot settings (display_title, is_active).
     * Note: slug is immutable and cannot be changed.
     * 
     * PATCH /api/slots/{slug}/settings
     * Headers: Authorization: Bearer <token>
     * Body: { "displayTitle": "New Title", "isActive": true }
     */
    @PatchMapping("/{slug}/settings")
    public ResponseEntity<SlotResponse> updateSettings(
            @PathVariable String slug,
            @Valid @RequestBody SlotSettingsRequest request,
            @AuthenticationPrincipal ChurchShareUserDetails userDetails) {
        
        ChurchAccount church = getChurchAccount(userDetails);
        SlotResponse response = slotService.updateSettings(church, slug, request);
        log.info("Updated settings for slot '{}' by user: {}", slug, userDetails.getEmail());
        return ResponseEntity.ok(response);
    }

    /**
     * Archive a slot (set is_active = false).
     * The slug remains reserved.
     * 
     * DELETE /api/slots/{slug}
     * Headers: Authorization: Bearer <token>
     */
    @DeleteMapping("/{slug}")
    public ResponseEntity<SlotResponse> archiveSlot(
            @PathVariable String slug,
            @AuthenticationPrincipal ChurchShareUserDetails userDetails) {
        
        ChurchAccount church = getChurchAccount(userDetails);
        SlotResponse response = slotService.archiveSlot(church, slug);
        log.info("Archived slot '{}' by user: {}", slug, userDetails.getEmail());
        return ResponseEntity.ok(response);
    }
}
