package com.churchshare.service;

import com.churchshare.dto.CreateSlotRequest;
import com.churchshare.dto.DashboardStatsResponse;
import com.churchshare.dto.SlotPublicResponse;
import com.churchshare.dto.SlotResponse;
import com.churchshare.dto.UpdateSlotRequest;
import com.churchshare.entity.Church;
import com.churchshare.entity.DocumentSlot;
import com.churchshare.repository.DocumentSlotRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SlotServiceTest {

    @Mock
    private DocumentSlotRepository documentSlotRepository;

    @InjectMocks
    private SlotService slotService;

    private DocumentSlot sampleSlot;

    @BeforeEach
    void setUp() {
        Church church = new Church();
        church.setId(1L);

        sampleSlot = new DocumentSlot();
        sampleSlot.setId(10L);
        sampleSlot.setChurch(church);
        sampleSlot.setSlug("weekly-bulletin");
        sampleSlot.setDisplayTitle("Weekly Bulletin");
        sampleSlot.setStatus("ACTIVE");
        sampleSlot.setCategory("Announcements");
        sampleSlot.setDescription("A weekly bulletin");
        sampleSlot.setViewCount(5L);
        sampleSlot.setCurrentFileKey("slots/10/file.pdf");
        sampleSlot.setCurrentFileSizeBytes(2048L);
        sampleSlot.setOriginalFilename("bulletin.pdf");
        sampleSlot.setCurrentUploadedAt(Instant.parse("2025-01-01T00:00:00Z"));
    }

    @Test
    void testGetAllSlots() {
        when(documentSlotRepository.findByChurchId(1L)).thenReturn(List.of(sampleSlot));

        List<SlotResponse> result = slotService.getAllSlots(1L);

        assertEquals(1, result.size());
        SlotResponse resp = result.get(0);
        assertEquals("10", resp.id());
        assertEquals("Weekly Bulletin", resp.displayName());
        assertEquals("weekly-bulletin", resp.slug());
        assertTrue(resp.isActive());
        assertTrue(resp.hasFile());
        verify(documentSlotRepository).findByChurchId(1L);
    }

    @Test
    void testCreateSlot() {
        when(documentSlotRepository.findByChurchIdAndSlug(1L, "new-slot"))
                .thenReturn(Optional.empty());
        when(documentSlotRepository.save(any(DocumentSlot.class)))
                .thenAnswer(invocation -> {
                    DocumentSlot saved = invocation.getArgument(0);
                    saved.setId(20L);
                    return saved;
                });

        CreateSlotRequest request = new CreateSlotRequest(
                "New Slot", "new-slot", "Events", "desc", "ACTIVE");

        SlotResponse result = slotService.createSlot(1L, request);

        assertEquals("20", result.id());
        assertEquals("New Slot", result.displayName());
        assertEquals("new-slot", result.slug());
        assertEquals("Events", result.category());
        assertEquals("ACTIVE", result.status());
        verify(documentSlotRepository).save(any(DocumentSlot.class));
    }

    @Test
    void testCreateSlotDuplicateSlug() {
        when(documentSlotRepository.findByChurchIdAndSlug(1L, "weekly-bulletin"))
                .thenReturn(Optional.of(sampleSlot));

        CreateSlotRequest request = new CreateSlotRequest(
                "Duplicate", "weekly-bulletin", null, null, null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> slotService.createSlot(1L, request));

        assertTrue(ex.getMessage().contains("already exists"));
        verify(documentSlotRepository, never()).save(any());
    }

    @Test
    void testUpdateSlot() {
        when(documentSlotRepository.findById(10L)).thenReturn(Optional.of(sampleSlot));
        when(documentSlotRepository.save(any(DocumentSlot.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UpdateSlotRequest request = new UpdateSlotRequest(
                "Updated Title", "Events", "new desc", "DRAFT");

        SlotResponse result = slotService.updateSlot(10L, request);

        assertEquals("Updated Title", result.displayName());
        assertEquals("Events", result.category());
        assertEquals("DRAFT", result.status());
        verify(documentSlotRepository).save(sampleSlot);
    }

    @Test
    void testDeleteSlot() {
        when(documentSlotRepository.existsById(10L)).thenReturn(true);

        slotService.deleteSlot(10L);

        verify(documentSlotRepository).deleteById(10L);
    }

    @Test
    void testDeleteSlotNotFound() {
        when(documentSlotRepository.existsById(999L)).thenReturn(false);

        assertThrows(EntityNotFoundException.class, () -> slotService.deleteSlot(999L));
        verify(documentSlotRepository, never()).deleteById(anyLong());
    }

    @Test
    void testGetDashboardStats() {
        when(documentSlotRepository.countByChurchId(1L)).thenReturn(10L);
        when(documentSlotRepository.countByChurchIdAndStatus(1L, "ACTIVE")).thenReturn(7L);
        when(documentSlotRepository.countByChurchIdAndCurrentFileKeyIsNotNull(1L)).thenReturn(5L);
        when(documentSlotRepository.sumViewCountByChurchId(1L)).thenReturn(120L);

        DashboardStatsResponse stats = slotService.getDashboardStats(1L);

        assertEquals(10L, stats.totalSlots());
        assertEquals(7L, stats.activeSlots());
        assertEquals(5L, stats.slotsWithFiles());
        assertEquals(120L, stats.totalViews());
    }

    @Test
    void testGetPublicSlotActive() {
        when(documentSlotRepository.findFirstBySlug("weekly-bulletin"))
                .thenReturn(Optional.of(sampleSlot));

        SlotPublicResponse result = slotService.getPublicSlot("weekly-bulletin");

        assertNotNull(result);
        assertEquals("weekly-bulletin", result.slug());
        assertEquals("Weekly Bulletin", result.displayTitle());
        assertEquals("ACTIVE", result.status());
        assertTrue(result.hasFile());
    }

    @Test
    void testGetPublicSlotDraft() {
        sampleSlot.setStatus("DRAFT");
        when(documentSlotRepository.findFirstBySlug("weekly-bulletin"))
                .thenReturn(Optional.of(sampleSlot));

        SlotPublicResponse result = slotService.getPublicSlot("weekly-bulletin");

        assertNull(result);
    }

    @Test
    void testIncrementViewCount() {
        when(documentSlotRepository.findById(10L)).thenReturn(Optional.of(sampleSlot));
        when(documentSlotRepository.save(any(DocumentSlot.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        slotService.incrementViewCount(10L);

        assertEquals(6L, sampleSlot.getViewCount());
        verify(documentSlotRepository).save(sampleSlot);
    }
}
