package com.churchshare.controller;

import com.churchshare.dto.SlotResponse;
import com.churchshare.entity.DocumentSlot;
import com.churchshare.exception.ResourceNotFoundException;
import com.churchshare.repository.DocumentSlotRepository;
import com.churchshare.service.R2StorageService;
import com.churchshare.service.SlotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

/**
 * Controller for public viewer-facing endpoints.
 * 
 * These endpoints do NOT require authentication.
 * They serve the permanent-link functionality.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class ViewerController {

    private final SlotService slotService;
    private final DocumentSlotRepository slotRepository;
    private final R2StorageService storageService;

    /**
     * Resolve and redirect to the current PDF file.
     * 
     * GET /api/slots/{slug}/file
     * 
     * This is the main viewer endpoint. It:
     * 1. Looks up the slot by slug
     * 2. Checks if slot is active and has a file
     * 3. Generates a fresh presigned URL (cache-busting)
     * 4. Redirects to the presigned URL
     * 
     * Response headers include cache-control to prevent browser caching.
     */
    @GetMapping("/api/slots/{slug}/file")
    public ResponseEntity<Void> resolveFile(@PathVariable String slug) {
        log.info("Resolving file for slug: {}", slug);

        DocumentSlot slot = slotRepository.findBySlugWithChurch(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", slug));

        // Check if slot has a file
        if (!slot.hasFile()) {
            // Return empty state response instead of redirect
            return ResponseEntity.status(HttpStatus.NO_CONTENT)
                    .header("X-Slot-Empty", "true")
                    .header("X-Slot-Title", slot.getDisplayTitle() != null ? slot.getDisplayTitle() : "Document")
                    .header(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .header(HttpHeaders.EXPIRES, "0")
                    .build();
        }

        // Generate fresh presigned URL (cache-busting)
        String presignedUrl = storageService.generatePresignedUrl(slot.getCurrentFileKey());

        log.debug("Redirecting to presigned URL for slot: {}", slug);

        // Redirect with cache-control headers
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(presignedUrl))
                .header(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .build();
    }

    /**
     * Get slot metadata for viewer display.
     * 
     * GET /api/slots/{slug}/meta
     * 
     * Returns display_title, last_updated_at, and file info.
     * Used for showing document info before download.
     */
    @GetMapping("/api/slots/{slug}/meta")
    public ResponseEntity<SlotResponse> getSlotMeta(@PathVariable String slug) {
        log.info("Getting metadata for slug: {}", slug);

        SlotResponse response = slotService.getSlotForViewer(slug);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .body(response);
    }

    /**
     * QR-friendly permanent URL endpoint.
     * 
     * GET /view/{slug}
     * 
     * This is the canonical public URL for QR codes.
     * It redirects to the file or shows an empty state.
     */
    @GetMapping("/view/{slug}")
    public ResponseEntity<Void> viewSlot(@PathVariable String slug) {
        log.info("View request for slug: {}", slug);

        DocumentSlot slot = slotRepository.findBySlugWithChurch(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", slug));

        if (!slot.hasFile()) {
            // Return empty state - in a real app, this would render an HTML page
            return ResponseEntity.status(HttpStatus.OK)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .body(null);
        }

        // Generate fresh presigned URL
        String presignedUrl = storageService.generatePresignedUrl(slot.getCurrentFileKey());

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(presignedUrl))
                .header(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .build();
    }

    /**
     * Direct file download with proper headers.
     * 
     * GET /api/slots/{slug}/download
     * 
     * Forces download instead of inline display.
     */
    @GetMapping("/api/slots/{slug}/download")
    public ResponseEntity<Void> downloadFile(@PathVariable String slug) {
        log.info("Download request for slug: {}", slug);

        DocumentSlot slot = slotRepository.findBySlugWithChurch(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", slug));

        if (!slot.hasFile()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT)
                    .header(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate")
                    .build();
        }

        String presignedUrl = storageService.generatePresignedUrl(slot.getCurrentFileKey());
        String filename = getFilename(slot);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(presignedUrl))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .build();
    }

    /**
     * Generate a friendly filename for downloads.
     */
    private String getFilename(DocumentSlot slot) {
        if (slot.getDisplayTitle() != null && !slot.getDisplayTitle().isBlank()) {
            return slot.getDisplayTitle()
                    .replaceAll("[^a-zA-Z0-9\\s-]", "")
                    .replaceAll("\\s+", "-")
                    .toLowerCase() + ".pdf";
        }
        return slot.getSlug() + ".pdf";
    }
}
