package com.churchshare.controller;

import com.churchshare.dto.CreateSlotRequest;
import com.churchshare.dto.SlotResponse;
import com.churchshare.service.FileUploadService;
import com.churchshare.service.SlotService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminSlotControllerTest {

    @Mock
    private SlotService slotService;

    @Mock
    private FileUploadService fileUploadService;

    @InjectMocks
    private AdminSlotController adminSlotController;

    private SlotResponse sampleResponse() {
        return new SlotResponse(
                "10", "Weekly Bulletin", "weekly-bulletin",
                "/view/weekly-bulletin", "2025-01-01T00:00:00Z", null,
                true, true, 2048L, "bulletin.pdf",
                "Announcements", "A weekly bulletin", "ACTIVE", 5L);
    }

    @Test
    void testGetAllSlots() {
        when(slotService.getAllSlots(1L)).thenReturn(List.of(sampleResponse()));

        ResponseEntity<List<SlotResponse>> response = adminSlotController.getAllSlots();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Weekly Bulletin", response.getBody().get(0).displayName());
        verify(slotService).getAllSlots(1L);
    }

    @Test
    void testCreateSlot() {
        CreateSlotRequest request = new CreateSlotRequest(
                "New Slot", "new-slot", "Events", "desc", "ACTIVE");
        SlotResponse created = new SlotResponse(
                "20", "New Slot", "new-slot", "/view/new-slot",
                null, null, true, false, null, null,
                "Events", "desc", "ACTIVE", 0L);

        when(slotService.createSlot(eq(1L), any(CreateSlotRequest.class))).thenReturn(created);

        ResponseEntity<SlotResponse> response = adminSlotController.createSlot(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("20", response.getBody().id());
        assertEquals("New Slot", response.getBody().displayName());
        assertNotNull(response.getHeaders().getLocation());
        verify(slotService).createSlot(eq(1L), eq(request));
    }

    @Test
    void testUploadFile() {
        MultipartFile mockFile = mock(MultipartFile.class);
        SlotResponse updated = sampleResponse();
        when(fileUploadService.uploadFile(eq(10L), eq(1L), eq(mockFile))).thenReturn(updated);

        ResponseEntity<SlotResponse> response = adminSlotController.uploadFile(10L, mockFile);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().hasFile());
        verify(fileUploadService).uploadFile(10L, 1L, mockFile);
    }

    @Test
    void testDeleteSlot() {
        doNothing().when(slotService).deleteSlot(10L);

        ResponseEntity<Void> response = adminSlotController.deleteSlot(10L);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(slotService).deleteSlot(10L);
    }
}
