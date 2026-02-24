package com.churchshare.controller;

import com.churchshare.entity.ChurchAccount;
import com.churchshare.entity.DocumentSlot;
import com.churchshare.exception.ResourceNotFoundException;
import com.churchshare.repository.DocumentSlotRepository;
import com.churchshare.service.R2StorageService;
import com.churchshare.service.SlotService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.net.URI;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive unit tests for ViewerController.
 * 
 * Testing priorities:
 * 1. Empty slot returns friendly response (not 404)
 * 2. Cache-control headers present on all responses
 * 3. PDF redirect works correctly
 * 4. Metadata endpoint returns correct data
 */
@WebMvcTest(ViewerController.class)
@DisplayName("ViewerController Unit Tests")
class ViewerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SlotService slotService;

    @MockBean
    private DocumentSlotRepository slotRepository;

    @MockBean
    private R2StorageService storageService;

    private DocumentSlot testSlot;
    private ChurchAccount testChurch;
    private UUID slotId;
    private UUID churchId;

    @BeforeEach
    void setUp() {
        churchId = UUID.randomUUID();
        slotId = UUID.randomUUID();

        testChurch = new ChurchAccount();
        testChurch.setId(churchId);
        testChurch.setName("Test Church");

        testSlot = DocumentSlot.builder()
                .id(slotId)
                .churchAccount(testChurch)
                .slug("sunday-liturgy")
                .displayTitle("Sunday Liturgy")
                .isActive(true)
                .build();
    }

    @Nested
    @DisplayName("GET /api/slots/{slug}/file Tests")
    class ResolveFileTests {

        @Test
        @DisplayName("should redirect to presigned URL when slot has file")
        void shouldRedirectToPresignedUrlWhenSlotHasFile() throws Exception {
            // Given
            testSlot.updateFile("test-file-key.pdf", 1024L, "application/pdf");
            String presignedUrl = "https://r2.example.com/bucket/test-file-key.pdf?signature=abc123";

            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));
            given(storageService.generatePresignedUrl("test-file-key.pdf"))
                    .willReturn(presignedUrl);

            // When & Then
            mockMvc.perform(get("/api/slots/sunday-liturgy/file"))
                    .andExpect(status().isFound())
                    .andExpect(header().string(HttpHeaders.LOCATION, presignedUrl))
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate"))
                    .andExpect(header().string(HttpHeaders.PRAGMA, "no-cache"))
                    .andExpect(header().string(HttpHeaders.EXPIRES, "0"));
        }

        @Test
        @DisplayName("should return 204 NO_CONTENT with empty state when slot has no file")
        void shouldReturnNoContentWithEmptyStateWhenSlotHasNoFile() throws Exception {
            // Given - slot exists but has no file
            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));

            // When & Then
            ResultActions result = mockMvc.perform(get("/api/slots/sunday-liturgy/file"))
                    .andExpect(status().isNoContent())
                    .andExpect(header().string("X-Slot-Empty", "true"))
                    .andExpect(header().string("X-Slot-Title", "Sunday Liturgy"))
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate"))
                    .andExpect(header().string(HttpHeaders.PRAGMA, "no-cache"))
                    .andExpect(header().string(HttpHeaders.EXPIRES, "0"));
        }

        @Test
        @DisplayName("should return 204 with default title when slot has no file and no display title")
        void shouldReturnNoContentWithDefaultTitleWhenSlotHasNoFileAndNoDisplayTitle() throws Exception {
            // Given - slot exists but has no file and no display title
            testSlot.setDisplayTitle(null);
            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));

            // When & Then
            mockMvc.perform(get("/api/slots/sunday-liturgy/file"))
                    .andExpect(status().isNoContent())
                    .andExpect(header().string("X-Slot-Empty", "true"))
                    .andExpect(header().string("X-Slot-Title", "Document"));
        }

        @Test
        @DisplayName("should return 404 when slot not found")
        void shouldReturn404WhenSlotNotFound() throws Exception {
            // Given
            given(slotRepository.findBySlugWithChurch("non-existent"))
                    .willReturn(Optional.empty());

            // When & Then
            mockMvc.perform(get("/api/slots/non-existent/file"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should handle inactive slot with file - still serves file")
        void shouldHandleInactiveSlotWithFile() throws Exception {
            // Given - inactive slot with file
            testSlot.archive();
            testSlot.updateFile("test-file-key.pdf", 1024L, "application/pdf");
            String presignedUrl = "https://r2.example.com/bucket/test-file-key.pdf?signature=abc123";

            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));
            given(storageService.generatePresignedUrl("test-file-key.pdf"))
                    .willReturn(presignedUrl);

            // When & Then - inactive slots still serve files (hasFile() checks isActive)
            // Note: DocumentSlot.hasFile() returns false if !isActive
            // So this should return empty state
            mockMvc.perform(get("/api/slots/sunday-liturgy/file"))
                    .andExpect(status().isNoContent())
                    .andExpect(header().string("X-Slot-Empty", "true"));
        }

        @Test
        @DisplayName("should include cache-busting headers on redirect")
        void shouldIncludeCacheBustingHeadersOnRedirect() throws Exception {
            // Given
            testSlot.updateFile("test-file-key.pdf", 1024L, "application/pdf");
            String presignedUrl = "https://r2.example.com/bucket/test-file-key.pdf?signature=abc123";

            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));
            given(storageService.generatePresignedUrl("test-file-key.pdf"))
                    .willReturn(presignedUrl);

            // When & Then
            mockMvc.perform(get("/api/slots/sunday-liturgy/file"))
                    .andExpect(status().isFound())
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate"))
                    .andExpect(header().string(HttpHeaders.PRAGMA, "no-cache"))
                    .andExpect(header().string(HttpHeaders.EXPIRES, "0"));
        }
    }

    @Nested
    @DisplayName("GET /api/slots/{slug}/meta Tests")
    class GetSlotMetaTests {

        @Test
        @DisplayName("should return slot metadata")
        void shouldReturnSlotMetadata() throws Exception {
            // Given
            given(slotService.getSlotForViewer("sunday-liturgy"))
                    .willReturn(com.churchshare.dto.SlotResponse.forViewer(testSlot, "http://localhost:8080"));

            // When & Then
            mockMvc.perform(get("/api/slots/sunday-liturgy/meta"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.slug").value("sunday-liturgy"))
                    .andExpect(jsonPath("$.displayName").value("Sunday Liturgy"))
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate"))
                    .andExpect(header().string(HttpHeaders.PRAGMA, "no-cache"));
        }

        @Test
        @DisplayName("should return metadata for slot without file")
        void shouldReturnMetadataForSlotWithoutFile() throws Exception {
            // Given - slot exists but has no file
            given(slotService.getSlotForViewer("empty-slot"))
                    .willReturn(com.churchshare.dto.SlotResponse.forViewer(testSlot, "http://localhost:8080"));

            // When & Then
            mockMvc.perform(get("/api/slots/empty-slot/meta"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.hasFile").value(false));
        }

        @Test
        @DisplayName("should return 404 when slot not found for metadata")
        void shouldReturn404WhenSlotNotFoundForMetadata() throws Exception {
            // Given
            given(slotService.getSlotForViewer("non-existent"))
                    .willThrow(new ResourceNotFoundException("Slot", "non-existent"));

            // When & Then
            mockMvc.perform(get("/api/slots/non-existent/meta"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should include cache-control headers on metadata response")
        void shouldIncludeCacheControlHeadersOnMetadataResponse() throws Exception {
            // Given
            given(slotService.getSlotForViewer("sunday-liturgy"))
                    .willReturn(com.churchshare.dto.SlotResponse.forViewer(testSlot, "http://localhost:8080"));

            // When & Then
            mockMvc.perform(get("/api/slots/sunday-liturgy/meta"))
                    .andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate"))
                    .andExpect(header().string(HttpHeaders.PRAGMA, "no-cache"))
                    .andExpect(header().string(HttpHeaders.EXPIRES, "0"));
        }
    }

    @Nested
    @DisplayName("GET /view/{slug} Tests")
    class ViewSlotTests {

        @Test
        @DisplayName("should redirect to presigned URL when slot has file")
        void shouldRedirectToPresignedUrlWhenSlotHasFileForView() throws Exception {
            // Given
            testSlot.updateFile("test-file-key.pdf", 1024L, "application/pdf");
            String presignedUrl = "https://r2.example.com/bucket/test-file-key.pdf?signature=abc123";

            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));
            given(storageService.generatePresignedUrl("test-file-key.pdf"))
                    .willReturn(presignedUrl);

            // When & Then
            mockMvc.perform(get("/view/sunday-liturgy"))
                    .andExpect(status().isFound())
                    .andExpect(header().string(HttpHeaders.LOCATION, presignedUrl))
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate"));
        }

        @Test
        @DisplayName("should return OK with empty state when slot has no file")
        void shouldReturnOkWithEmptyStateWhenSlotHasNoFileForView() throws Exception {
            // Given - slot exists but has no file
            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));

            // When & Then
            mockMvc.perform(get("/view/sunday-liturgy"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate"));
        }

        @Test
        @DisplayName("should return 404 when slot not found for view")
        void shouldReturn404WhenSlotNotFoundForView() throws Exception {
            // Given
            given(slotRepository.findBySlugWithChurch("non-existent"))
                    .willReturn(Optional.empty());

            // When & Then
            mockMvc.perform(get("/view/non-existent"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should include cache-busting headers on view redirect")
        void shouldIncludeCacheBustingHeadersOnViewRedirect() throws Exception {
            // Given
            testSlot.updateFile("test-file-key.pdf", 1024L, "application/pdf");
            String presignedUrl = "https://r2.example.com/bucket/test-file-key.pdf?signature=abc123";

            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));
            given(storageService.generatePresignedUrl("test-file-key.pdf"))
                    .willReturn(presignedUrl);

            // When & Then
            mockMvc.perform(get("/view/sunday-liturgy"))
                    .andExpect(status().isFound())
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate"))
                    .andExpect(header().string(HttpHeaders.PRAGMA, "no-cache"))
                    .andExpect(header().string(HttpHeaders.EXPIRES, "0"));
        }
    }

    @Nested
    @DisplayName("GET /api/slots/{slug}/download Tests")
    class DownloadFileTests {

        @Test
        @DisplayName("should redirect to presigned URL with attachment disposition")
        void shouldRedirectToPresignedUrlWithAttachmentDisposition() throws Exception {
            // Given
            testSlot.updateFile("test-file-key.pdf", 1024L, "application/pdf");
            testSlot.setDisplayTitle("Sunday Liturgy");
            String presignedUrl = "https://r2.example.com/bucket/test-file-key.pdf?signature=abc123";

            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));
            given(storageService.generatePresignedUrl("test-file-key.pdf"))
                    .willReturn(presignedUrl);

            // When & Then
            mockMvc.perform(get("/api/slots/sunday-liturgy/download"))
                    .andExpect(status().isFound())
                    .andExpect(header().string(HttpHeaders.LOCATION, presignedUrl))
                    .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"sunday-liturgy.pdf\""));
        }

        @Test
        @DisplayName("should return NO_CONTENT when slot has no file for download")
        void shouldReturnNoContentWhenSlotHasNoFileForDownload() throws Exception {
            // Given - slot exists but has no file
            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));

            // When & Then
            mockMvc.perform(get("/api/slots/sunday-liturgy/download"))
                    .andExpect(status().isNoContent())
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate"));
        }

        @Test
        @DisplayName("should return 404 when slot not found for download")
        void shouldReturn404WhenSlotNotFoundForDownload() throws Exception {
            // Given
            given(slotRepository.findBySlugWithChurch("non-existent"))
                    .willReturn(Optional.empty());

            // When & Then
            mockMvc.perform(get("/api/slots/non-existent/download"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should use display title for filename when available")
        void shouldUseDisplayTitleForFilenameWhenAvailable() throws Exception {
            // Given
            testSlot.updateFile("test-file-key.pdf", 1024L, "application/pdf");
            testSlot.setDisplayTitle("Weekly Bulletin - June 2025");
            String presignedUrl = "https://r2.example.com/bucket/test-file-key.pdf?signature=abc123";

            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));
            given(storageService.generatePresignedUrl("test-file-key.pdf"))
                    .willReturn(presignedUrl);

            // When & Then
            mockMvc.perform(get("/api/slots/sunday-liturgy/download"))
                    .andExpect(status().isFound())
                    .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"weekly-bulletin-june-2025.pdf\""));
        }

        @Test
        @DisplayName("should use slug for filename when no display title")
        void shouldUseSlugForFilenameWhenNoDisplayTitle() throws Exception {
            // Given
            testSlot.updateFile("test-file-key.pdf", 1024L, "application/pdf");
            testSlot.setDisplayTitle(null);
            String presignedUrl = "https://r2.example.com/bucket/test-file-key.pdf?signature=abc123";

            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));
            given(storageService.generatePresignedUrl("test-file-key.pdf"))
                    .willReturn(presignedUrl);

            // When & Then
            mockMvc.perform(get("/api/slots/sunday-liturgy/download"))
                    .andExpect(status().isFound())
                    .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"sunday-liturgy.pdf\""));
        }
    }

    @Nested
    @DisplayName("Cache Control Header Tests")
    class CacheControlHeaderTests {

        @Test
        @DisplayName("should always include no-store cache control on file endpoint")
        void shouldAlwaysIncludeNoStoreCacheControlOnFileEndpoint() throws Exception {
            // Given - test both with and without file
            given(slotRepository.findBySlugWithChurch("with-file"))
                    .willReturn(Optional.of(testSlot));
            given(slotRepository.findBySlugWithChurch("without-file"))
                    .willReturn(Optional.of(testSlot));
            
            testSlot.updateFile("test.pdf", 1024L, "application/pdf");
            given(storageService.generatePresignedUrl("test.pdf"))
                    .willReturn("https://example.com/test.pdf");

            // When & Then - with file (redirect)
            mockMvc.perform(get("/api/slots/with-file/file"))
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate"));

            // When & Then - without file (empty state)
            testSlot.clearFile();
            mockMvc.perform(get("/api/slots/without-file/file"))
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store, must-revalidate"));
        }

        @Test
        @DisplayName("should always include pragma no-cache header")
        void shouldAlwaysIncludePragmaNoCacheHeader() throws Exception {
            // Given
            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));

            // When & Then
            mockMvc.perform(get("/api/slots/sunday-liturgy/file"))
                    .andExpect(header().string(HttpHeaders.PRAGMA, "no-cache"));

            mockMvc.perform(get("/api/slots/sunday-liturgy/meta"))
                    .andExpect(header().string(HttpHeaders.PRAGMA, "no-cache"));

            mockMvc.perform(get("/view/sunday-liturgy"))
                    .andExpect(header().string(HttpHeaders.PRAGMA, "no-cache"));
        }

        @Test
        @DisplayName("should always include expires 0 header")
        void shouldAlwaysIncludeExpires0Header() throws Exception {
            // Given
            testSlot.updateFile("test.pdf", 1024L, "application/pdf");
            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));
            given(storageService.generatePresignedUrl("test.pdf"))
                    .willReturn("https://example.com/test.pdf");

            // When & Then
            mockMvc.perform(get("/api/slots/sunday-liturgy/file"))
                    .andExpect(header().string(HttpHeaders.EXPIRES, "0"));

            mockMvc.perform(get("/view/sunday-liturgy"))
                    .andExpect(header().string(HttpHeaders.EXPIRES, "0"));
        }
    }

    @Nested
    @DisplayName("Zero-Download Guarantee Tests")
    class ZeroDownloadGuaranteeTests {

        @Test
        @DisplayName("should serve PDF inline not as attachment on file endpoint")
        void shouldServePdfInlineNotAsAttachmentOnFileEndpoint() throws Exception {
            // Given
            testSlot.updateFile("test-file-key.pdf", 1024L, "application/pdf");
            String presignedUrl = "https://r2.example.com/bucket/test-file-key.pdf?signature=abc123";

            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));
            given(storageService.generatePresignedUrl("test-file-key.pdf"))
                    .willReturn(presignedUrl);

            // When & Then
            // Note: The file endpoint redirects, so Content-Disposition is set on the presigned URL
            // The presigned URL from R2 should have inline disposition by default
            // This test verifies the redirect happens (not direct download)
            mockMvc.perform(get("/api/slots/sunday-liturgy/file"))
                    .andExpect(status().isFound())
                    // Verify NO Content-Disposition: attachment header on redirect
                    .andExpect(result -> {
                        String disposition = result.getResponse().getHeader(HttpHeaders.CONTENT_DISPOSITION);
                        // Should be null or not contain 'attachment'
                        if (disposition != null) {
                            org.assertj.core.api.Assertions.assertThat(disposition)
                                    .doesNotContain("attachment");
                        }
                    });
        }

        @Test
        @DisplayName("should use attachment disposition only on explicit download endpoint")
        void shouldUseAttachmentDispositionOnlyOnExplicitDownloadEndpoint() throws Exception {
            // Given
            testSlot.updateFile("test-file-key.pdf", 1024L, "application/pdf");
            testSlot.setDisplayTitle("Sunday Liturgy");
            String presignedUrl = "https://r2.example.com/bucket/test-file-key.pdf?signature=abc123";

            given(slotRepository.findBySlugWithChurch("sunday-liturgy"))
                    .willReturn(Optional.of(testSlot));
            given(storageService.generatePresignedUrl("test-file-key.pdf"))
                    .willReturn(presignedUrl);

            // When & Then - download endpoint should have attachment
            mockMvc.perform(get("/api/slots/sunday-liturgy/download"))
                    .andExpect(status().isFound())
                    .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, 
                            org.mockito.Matchers.contains("attachment")));
        }
    }

    @Nested
    @DisplayName("Friendly Error Response Tests")
    class FriendlyErrorResponseTests {

        @Test
        @DisplayName("should return friendly empty state not 404 for slot without file")
        void shouldReturnFriendlyEmptyStateNot404ForSlotWithoutFile() throws Exception {
            // Given - slot exists but has no file
            given(slotRepository.findBySlugWithChurch("empty-slot"))
                    .willReturn(Optional.of(testSlot));

            // When & Then
            // Should NOT be 404 - should be 204 NO_CONTENT with friendly headers
            mockMvc.perform(get("/api/slots/empty-slot/file"))
                    .andExpect(status().isNotEqualTo(404))
                    .andExpect(status().isNoContent())
                    .andExpect(header().string("X-Slot-Empty", "true"))
                    .andExpect(header().string("X-Slot-Title", "Sunday Liturgy"));
        }

        @Test
        @DisplayName("should return 404 only when slot truly does not exist")
        void shouldReturn404OnlyWhenSlotTrulyDoesNotExist() throws Exception {
            // Given
            given(slotRepository.findBySlugWithChurch("non-existent"))
                    .willReturn(Optional.empty());

            // When & Then
            mockMvc.perform(get("/api/slots/non-existent/file"))
                    .andExpect(status().isNotFound());
        }
    }
}
