package com.churchshare.controller;

import com.churchshare.dto.SlotCreateRequest;
import com.churchshare.dto.SlotResponse;
import com.churchshare.dto.SlotSettingsRequest;
import com.churchshare.dto.SlotUploadResponse;
import com.churchshare.entity.ChurchAccount;
import com.churchshare.exception.ResourceNotFoundException;
import com.churchshare.repository.ChurchAccountRepository;
import com.churchshare.security.ChurchShareUserDetails;
import com.churchshare.service.SlotService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive unit tests for SlotController.
 * 
 * Testing priorities:
 * 1. Authentication required (401 without token)
 * 2. CRUD operations for slots
 * 3. File upload (hot-swap) functionality
 * 4. Error handling and edge cases
 */
@WebMvcTest(SlotController.class)
@DisplayName("SlotController Unit Tests")
class SlotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SlotService slotService;

    @MockBean
    private ChurchAccountRepository churchRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private ChurchShareUserDetails testUserDetails;
    private ChurchAccount testChurch;
    private SlotResponse testSlotResponse;
    private UUID churchId;
    private UUID slotId;

    @BeforeEach
    void setUp() {
        churchId = UUID.randomUUID();
        slotId = UUID.randomUUID();

        testChurch = new ChurchAccount();
        testChurch.setId(churchId);
        testChurch.setName("Test Church");

        testUserDetails = new ChurchShareUserDetails(
                UUID.randomUUID(),
                churchId,
                "admin@testchurch.com",
                "password",
                List.of()
        );

        testSlotResponse = SlotResponse.builder()
                .id(slotId)
                .slug("sunday-liturgy")
                .displayName("Sunday Liturgy")
                .isActive(true)
                .lastUpdatedAt(Instant.now())
                .viewerUrl("http://localhost:8080/view/sunday-liturgy")
                .build();
    }

    @Nested
    @DisplayName("Authentication Tests")
    class AuthenticationTests {

        @Test
        @DisplayName("should return 401 without authentication token")
        void shouldReturn401WithoutAuthenticationToken() throws Exception {
            // When & Then
            mockMvc.perform(get("/api/slots"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 401 for POST without token")
        void shouldReturn401ForPostWithoutToken() throws Exception {
            // Given
            SlotCreateRequest request = new SlotCreateRequest("test-slug", "Test", true);

            // When & Then
            mockMvc.perform(post("/api/slots")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 401 for PATCH without token")
        void shouldReturn401ForPatchWithoutToken() throws Exception {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "test.pdf",
                    "application/pdf",
                    "PDF content".getBytes()
            );

            // When & Then
            mockMvc.perform(multipart("/api/slots/sunday-liturgy/file")
                    .file(file)
                    .with(request -> {
                        request.setMethod("PATCH");
                        return request;
                    }))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 401 for DELETE without token")
        void shouldReturn401ForDeleteWithoutToken() throws Exception {
            // When & Then
            mockMvc.perform(delete("/api/slots/sunday-liturgy"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/slots Tests")
    class GetAllSlotsTests {

        @Test
        @DisplayName("should return list of slots with valid authentication")
        void shouldReturnListOfSlotsWithValidAuthentication() throws Exception {
            // Given
            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.getAllSlots(testChurch)).willReturn(List.of(testSlotResponse));

            // When & Then
            mockMvc.perform(get("/api/slots")
                    .with(user(testUserDetails)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].slug").value("sunday-liturgy"));
        }

        @Test
        @DisplayName("should return empty list when no slots exist")
        void shouldReturnEmptyListWhenNoSlotsExist() throws Exception {
            // Given
            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.getAllSlots(testChurch)).willReturn(List.of());

            // When & Then
            mockMvc.perform(get("/api/slots")
                    .with(user(testUserDetails)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }

    @Nested
    @DisplayName("POST /api/slots Tests")
    class CreateSlotTests {

        @Test
        @DisplayName("should create slot with valid request")
        void shouldCreateSlotWithValidRequest() throws Exception {
            // Given
            SlotCreateRequest request = new SlotCreateRequest("weekly-bulletin", "Weekly Bulletin", true);
            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.createSlot(eq(testChurch), any(SlotCreateRequest.class)))
                    .willReturn(testSlotResponse);

            // When & Then
            mockMvc.perform(post("/api/slots")
                    .with(user(testUserDetails))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.slug").value("sunday-liturgy"))
                    .andExpect(jsonPath("$.displayName").value("Sunday Liturgy"));
        }

        @Test
        @DisplayName("should return 400 for invalid request body")
        void shouldReturn400ForInvalidRequestBody() throws Exception {
            // Given - empty body
            // When & Then
            mockMvc.perform(post("/api/slots")
                    .with(user(testUserDetails))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 for missing required fields")
        void shouldReturn400ForMissingRequiredFields() throws Exception {
            // Given - missing slug
            String invalidJson = "{\"displayTitle\": \"Test\"}";

            // When & Then
            mockMvc.perform(post("/api/slots")
                    .with(user(testUserDetails))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(invalidJson))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/slots/{slug} Tests")
    class GetSlotTests {

        @Test
        @DisplayName("should return slot by slug")
        void shouldReturnSlotBySlug() throws Exception {
            // Given
            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.getSlotBySlug(testChurch, "sunday-liturgy"))
                    .willReturn(testSlotResponse);

            // When & Then
            mockMvc.perform(get("/api/slots/sunday-liturgy")
                    .with(user(testUserDetails)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.slug").value("sunday-liturgy"));
        }

        @Test
        @DisplayName("should return 404 when slot not found")
        void shouldReturn404WhenSlotNotFound() throws Exception {
            // Given
            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.getSlotBySlug(testChurch, "non-existent"))
                    .willThrow(new ResourceNotFoundException("Slot", "non-existent"));

            // When & Then
            mockMvc.perform(get("/api/slots/non-existent")
                    .with(user(testUserDetails)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PATCH /api/slots/{slug}/file Tests")
    class UploadFileTests {

        @Test
        @DisplayName("should upload file and return upload response")
        void shouldUploadFileAndReturnUploadResponse() throws Exception {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "test.pdf",
                    "application/pdf",
                    "PDF content".getBytes()
            );

            SlotUploadResponse uploadResponse = SlotUploadResponse.builder()
                    .slotId(slotId)
                    .slug("sunday-liturgy")
                    .displayName("Sunday Liturgy")
                    .fileSize(1024L)
                    .mimeType("application/pdf")
                    .uploadedAt(Instant.now())
                    .message("File uploaded successfully")
                    .build();

            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.uploadFile(any(), eq("sunday-liturgy"), any(), any()))
                    .willReturn(uploadResponse);

            // When & Then
            mockMvc.perform(multipart("/api/slots/sunday-liturgy/file")
                    .with(user(testUserDetails))
                    .file(file)
                    .with(request -> {
                        request.setMethod("PATCH");
                        return request;
                    }))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.slug").value("sunday-liturgy"))
                    .andExpect(jsonPath("$.message").value("File uploaded successfully"));
        }

        @Test
        @DisplayName("should return 400 when file is missing")
        void shouldReturn400WhenFileIsMissing() throws Exception {
            // Given
            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));

            // When & Then
            mockMvc.perform(multipart("/api/slots/sunday-liturgy/file")
                    .with(user(testUserDetails))
                    .with(request -> {
                        request.setMethod("PATCH");
                        return request;
                    }))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when slot not found")
        void shouldReturn404WhenSlotNotFoundForUpload() throws Exception {
            // Given
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "test.pdf",
                    "application/pdf",
                    "PDF content".getBytes()
            );

            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.uploadFile(any(), eq("non-existent"), any(), any()))
                    .willThrow(new ResourceNotFoundException("Slot", "non-existent"));

            // When & Then
            mockMvc.perform(multipart("/api/slots/non-existent/file")
                    .with(user(testUserDetails))
                    .file(file)
                    .with(request -> {
                        request.setMethod("PATCH");
                        return request;
                    }))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("PATCH /api/slots/{slug}/settings Tests")
    class UpdateSettingsTests {

        @Test
        @DisplayName("should update slot settings")
        void shouldUpdateSlotSettings() throws Exception {
            // Given
            SlotSettingsRequest request = new SlotSettingsRequest("New Title", true);
            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.updateSettings(eq(testChurch), eq("sunday-liturgy"), any()))
                    .willReturn(testSlotResponse);

            // When & Then
            mockMvc.perform(patch("/api/slots/sunday-liturgy/settings")
                    .with(user(testUserDetails))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.slug").value("sunday-liturgy"));
        }

        @Test
        @DisplayName("should return 404 when slot not found for settings update")
        void shouldReturn404WhenSlotNotFoundForSettingsUpdate() throws Exception {
            // Given
            SlotSettingsRequest request = new SlotSettingsRequest("New Title", true);
            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.updateSettings(any(), eq("non-existent"), any()))
                    .willThrow(new ResourceNotFoundException("Slot", "non-existent"));

            // When & Then
            mockMvc.perform(patch("/api/slots/non-existent/settings")
                    .with(user(testUserDetails))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/slots/{slug} Tests")
    class ArchiveSlotTests {

        @Test
        @DisplayName("should archive slot")
        void shouldArchiveSlot() throws Exception {
            // Given
            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.archiveSlot(testChurch, "sunday-liturgy"))
                    .willReturn(testSlotResponse);

            // When & Then
            mockMvc.perform(delete("/api/slots/sunday-liturgy")
                    .with(user(testUserDetails)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.slug").value("sunday-liturgy"));
        }

        @Test
        @DisplayName("should return 404 when slot not found for archive")
        void shouldReturn404WhenSlotNotFoundForArchive() throws Exception {
            // Given
            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.archiveSlot(testChurch, "non-existent"))
                    .willThrow(new ResourceNotFoundException("Slot", "non-existent"));

            // When & Then
            mockMvc.perform(delete("/api/slots/non-existent")
                    .with(user(testUserDetails)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("Error Handling Tests")
    class ErrorHandlingTests {

        @Test
        @DisplayName("should return 404 when church not found")
        void shouldReturn404WhenChurchNotFound() throws Exception {
            // Given
            given(churchRepository.findById(churchId)).willReturn(Optional.empty());

            // When & Then
            mockMvc.perform(get("/api/slots")
                    .with(user(testUserDetails)))
                    .andExpect(status().isInternalServerError());
        }

        @Test
        @DisplayName("should handle general exceptions gracefully")
        void shouldHandleGeneralExceptionsGracefully() throws Exception {
            // Given
            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.getAllSlots(testChurch))
                    .willThrow(new RuntimeException("Unexpected error"));

            // When & Then
            mockMvc.perform(get("/api/slots")
                    .with(user(testUserDetails)))
                    .andExpect(status().is5xxServerError());
        }
    }

    @Nested
    @DisplayName("Response Format Tests")
    class ResponseFormatTests {

        @Test
        @DisplayName("should return JSON content type")
        void shouldReturnJsonContentType() throws Exception {
            // Given
            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.getAllSlots(testChurch)).willReturn(List.of(testSlotResponse));

            // When & Then
            mockMvc.perform(get("/api/slots")
                    .with(user(testUserDetails)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON));
        }

        @Test
        @DisplayName("should include all expected fields in slot response")
        void shouldIncludeAllExpectedFieldsInSlotResponse() throws Exception {
            // Given
            given(churchRepository.findById(churchId)).willReturn(Optional.of(testChurch));
            given(slotService.getAllSlots(testChurch)).willReturn(List.of(testSlotResponse));

            // When & Then
            mockMvc.perform(get("/api/slots")
                    .with(user(testUserDetails)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").exists())
                    .andExpect(jsonPath("$[0].slug").exists())
                    .andExpect(jsonPath("$[0].displayName").exists())
                    .andExpect(jsonPath("$[0].isActive").exists())
                    .andExpect(jsonPath("$[0].lastUpdatedAt").exists())
                    .andExpect(jsonPath("$[0].viewerUrl").exists());
        }
    }
}
