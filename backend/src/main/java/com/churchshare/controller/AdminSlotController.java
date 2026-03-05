package com.churchshare.controller;

import com.churchshare.dto.CreateSlotRequest;
import com.churchshare.dto.DashboardStatsResponse;
import com.churchshare.dto.SlotResponse;
import com.churchshare.dto.UpdateSlotRequest;
import com.churchshare.service.FileUploadService;
import com.churchshare.service.SlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/slots")
@RequiredArgsConstructor
public class AdminSlotController {

    private final SlotService slotService;
    private final FileUploadService fileUploadService;

    // Single-tenant v1: hardcoded church ID
    private static final Long CHURCH_ID = 1L;
    private static final Long ADMIN_USER_ID = 1L;

    @GetMapping
    public ResponseEntity<List<SlotResponse>> getAllSlots() {
        List<SlotResponse> slots = slotService.getAllSlots(CHURCH_ID);
        return ResponseEntity.ok(slots);
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        DashboardStatsResponse stats = slotService.getDashboardStats(CHURCH_ID);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SlotResponse> getSlotById(@PathVariable Long id) {
        SlotResponse slot = slotService.getSlotById(id);
        return ResponseEntity.ok(slot);
    }

    @PostMapping
    public ResponseEntity<SlotResponse> createSlot(@Valid @RequestBody CreateSlotRequest request) {
        SlotResponse slot = slotService.createSlot(CHURCH_ID, request);
        URI location = URI.create("/api/v1/admin/slots/" + slot.id());
        return ResponseEntity.created(location).body(slot);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SlotResponse> updateSlot(@PathVariable Long id,
                                                   @RequestBody UpdateSlotRequest request) {
        SlotResponse slot = slotService.updateSlot(id, request);
        return ResponseEntity.ok(slot);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSlot(@PathVariable Long id) {
        slotService.deleteSlot(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<Void> archiveSlot(@PathVariable Long id) {
        slotService.archiveSlot(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/upload")
    public ResponseEntity<SlotResponse> uploadFile(@PathVariable Long id,
                                                   @RequestParam("file") MultipartFile file) {
        SlotResponse slot = fileUploadService.uploadFile(id, ADMIN_USER_ID, file);
        return ResponseEntity.ok(slot);
    }
}
