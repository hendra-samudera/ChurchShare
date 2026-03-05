package com.churchshare.controller;

import com.churchshare.dto.SlotPublicResponse;
import com.churchshare.entity.DocumentSlot;
import com.churchshare.service.SlotService;
import com.churchshare.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/slots")
@RequiredArgsConstructor
public class PublicSlotController {

    private final SlotService slotService;
    private final StorageService storageService;

    // Single-tenant v1: hardcoded church ID
    private static final Long CHURCH_ID = 1L;

    @GetMapping("/{slug}")
    public ResponseEntity<SlotPublicResponse> getPublicSlot(@PathVariable String slug) {
        DocumentSlot entity = slotService.getSlotBySlug(CHURCH_ID, slug);
        if (entity == null || "DRAFT".equals(entity.getStatus())) {
            return ResponseEntity.notFound().build();
        }
        slotService.incrementViewCount(entity.getId());
        SlotPublicResponse response = new SlotPublicResponse(
                entity.getSlug(),
                entity.getDisplayTitle(),
                entity.getStatus(),
                entity.getCurrentFileKey() != null,
                entity.getCategory()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{slug}/file")
    public ResponseEntity<byte[]> getSlotFile(@PathVariable String slug) {
        DocumentSlot slot = slotService.getSlotBySlug(CHURCH_ID, slug);
        if (slot == null) {
            return ResponseEntity.notFound().build();
        }

        if (slot.getCurrentFileKey() == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] fileBytes = storageService.getFileBytes(slot.getCurrentFileKey());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"" + slot.getOriginalFilename() + "\"");
        // Per PRD: no-store ensures browsers always fetch the current version
        headers.setCacheControl("no-store");

        return new ResponseEntity<>(fileBytes, headers, HttpStatus.OK);
    }
}
