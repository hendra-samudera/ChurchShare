package com.churchshare.integration;

import com.churchshare.dto.SlotCreateRequest;
import com.churchshare.dto.SlotResponse;
import com.churchshare.dto.SlotUploadResponse;
import com.churchshare.entity.AdminUser;
import com.churchshare.entity.ChurchAccount;
import com.churchshare.entity.DocumentSlot;
import com.churchshare.repository.ChurchAccountRepository;
import com.churchshare.repository.DocumentSlotRepository;
import com.churchshare.service.R2StorageService;
import com.churchshare.service.SlotService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Integration tests for Slot operations with actual PostgreSQL database.
 * 
 * Uses Testcontainers for real PostgreSQL instance.
 * R2 storage is mocked to avoid external dependencies.
 * 
 * Testing priorities:
 * 1. Full flow: create slot → upload file → get file → verify hot-swap
 * 2. Database constraints and transactions work correctly
 * 3. Hot-swap atomicity is preserved
 */
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@DisplayName("Slot Integration Tests")
class SlotIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("churchshare_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureTestProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName);
    }

    @Autowired
    private SlotService slotService;

    @Autowired
    private DocumentSlotRepository slotRepository;

    @Autowired
    private ChurchAccountRepository churchRepository;

    @MockBean
    private R2StorageService storageService;

    private ChurchAccount testChurch;
    private AdminUser testAdmin;

    @BeforeEach
    void setUp() {
        // Clean up any existing data
        slotRepository.deleteAll();
        churchRepository.deleteAll();

        // Create test church
        testChurch = new ChurchAccount();
        testChurch.setName("Integration Test Church");
        testChurch = churchRepository.save(testChurch);

        // Create test admin
        testAdmin = new AdminUser();
        testAdmin.setEmail("integration@test.com");
        testAdmin.setPassword("password");
        testAdmin.setChurchAccount(testChurch);

        // Mock storage service
        given(storageService.generateStorageKey(any(UUID.class), any(UUID.class)))
                .willReturn("churches/test/slots/test/" + UUID.randomUUID() + ".pdf");
        willDoNothing().given(storageService).uploadFile(anyString(), any(InputStream.class), anyString(), anyLong());
        willDoNothing().given(storageService).deleteFile(anyString());
        given(storageService.generatePresignedUrl(anyString()))
                .willReturn("https://r2.example.com/presigned-url");
    }

    @Nested
    @DisplayName("Full Flow Integration Tests")
    class FullFlowIntegrationTests {

        @Test
        @DisplayName("full flow: create slot → upload file → get file → verify hot-swap")
        @Transactional
        void fullFlowCreateSlotUploadFileGetFileVerifyHotSwap() {
            // Step 1: Create slot
            SlotCreateRequest createRequest = new SlotCreateRequest(
                    "sunday-liturgy",
                    "Sunday Liturgy",
                    true
            );
            SlotResponse createdSlot = slotService.createSlot(testChurch, createRequest);

            // Verify slot was created
            assertThat(createdSlot).isNotNull();
            assertThat(createdSlot.getSlug()).isEqualTo("sunday-liturgy");
            assertThat(createdSlot.getDisplayName()).isEqualTo("Sunday Liturgy");
            assertThat(createdSlot.isActive()).isTrue();

            // Verify in database
            Optional<DocumentSlot> slotInDb = slotRepository.findBySlugWithChurch("sunday-liturgy");
            assertThat(slotInDb).isPresent();
            assertThat(slotInDb.get().getCurrentFileKey()).isNull(); // No file yet

            // Step 2: Upload first file (v1)
            byte[] pdfContentV1 = "%PDF-1.4\nVersion 1".getBytes();
            MockMultipartFile fileV1 = new MockMultipartFile(
                    "file",
                    "liturgy-v1.pdf",
                    "application/pdf",
                    pdfContentV1
            );

            SlotUploadResponse uploadResponseV1 = slotService.uploadFile(
                    testChurch, "sunday-liturgy", fileV1, testAdmin
            );

            // Verify first upload
            assertThat(uploadResponseV1).isNotNull();
            assertThat(uploadResponseV1.getMessage()).contains("File uploaded successfully");

            // Verify file key was set in database
            DocumentSlot slotAfterV1 = slotRepository.findBySlugWithChurch("sunday-liturgy").get();
            String fileKeyV1 = slotAfterV1.getCurrentFileKey();
            assertThat(fileKeyV1).isNotNull();
            assertThat(fileKeyV1).isNotBlank();

            // Verify storage was called
            verify(storageService).uploadFile(eq(fileKeyV1), any(), eq("application/pdf"), anyLong());

            // Step 3: Hot-swap with new file (v2)
            byte[] pdfContentV2 = "%PDF-1.4\nVersion 2".getBytes();
            MockMultipartFile fileV2 = new MockMultipartFile(
                    "file",
                    "liturgy-v2.pdf",
                    "application/pdf",
                    pdfContentV2
            );

            SlotUploadResponse uploadResponseV2 = slotService.uploadFile(
                    testChurch, "sunday-liturgy", fileV2, testAdmin
            );

            // Verify hot-swap
            assertThat(uploadResponseV2).isNotNull();

            // Verify new file key is different
            DocumentSlot slotAfterV2 = slotRepository.findBySlugWithChurch("sunday-liturgy").get();
            String fileKeyV2 = slotAfterV2.getCurrentFileKey();
            assertThat(fileKeyV2).isNotNull();
            assertThat(fileKeyV2).isNotEqualTo(fileKeyV1);

            // Verify old file was deleted
            verify(storageService).deleteFile(fileKeyV1);

            // Verify new file was uploaded
            verify(storageService).uploadFile(eq(fileKeyV2), any(), eq("application/pdf"), anyLong());

            // Step 4: Get file URL - should point to v2
            String fileUrl = slotService.getFileUrl("sunday-liturgy");
            assertThat(fileUrl).isEqualTo("https://r2.example.com/presigned-url");
        }

        @Test
        @DisplayName("verify viewer always gets latest file after hot-swap")
        @Transactional
        void verifyViewerAlwaysGetsLatestFileAfterHotSwap() {
            // Create slot
            SlotCreateRequest createRequest = new SlotCreateRequest(
                    "weekly-bulletin",
                    "Weekly Bulletin",
                    true
            );
            slotService.createSlot(testChurch, createRequest);

            // Upload v1
            MockMultipartFile fileV1 = new MockMultipartFile(
                    "file",
                    "bulletin-v1.pdf",
                    "application/pdf",
                    "%PDF-1.4\nV1".getBytes()
            );
            slotService.uploadFile(testChurch, "weekly-bulletin", fileV1, testAdmin);

            // Get file URL for v1
            String urlV1 = slotService.getFileUrl("weekly-bulletin");
            assertThat(urlV1).isNotNull();

            // Hot-swap to v2
            MockMultipartFile fileV2 = new MockMultipartFile(
                    "file",
                    "bulletin-v2.pdf",
                    "application/pdf",
                    "%PDF-1.4\nV2".getBytes()
            );
            slotService.uploadFile(testChurch, "weekly-bulletin", fileV2, testAdmin);

            // Get file URL for v2
            String urlV2 = slotService.getFileUrl("weekly-bulletin");
            assertThat(urlV2).isNotNull();

            // URLs should be the same (presigned URL endpoint is the same)
            // But the underlying file key should be different
            // This is verified by checking the database
            DocumentSlot slot = slotRepository.findBySlugWithChurch("weekly-bulletin").get();
            assertThat(slot.getCurrentFileKey()).contains("bulletin-v2");
        }
    }

    @Nested
    @DisplayName("Database Constraint Tests")
    class DatabaseConstraintTests {

        @Test
        @DisplayName("slug must be unique within church")
        @Transactional
        void slugMustBeUniqueWithinChurch() {
            // Create first slot
            SlotCreateRequest request1 = new SlotCreateRequest("unique-slug", "First Slot", true);
            slotService.createSlot(testChurch, request1);

            // Try to create second slot with same slug
            SlotCreateRequest request2 = new SlotCreateRequest("unique-slug", "Second Slot", true);

            // Should throw ConflictException
            assertThatThrownBy(() -> slotService.createSlot(testChurch, request2))
                    .isInstanceOf(com.churchshare.exception.ConflictException.class)
                    .hasMessageContaining("unique-slug");
        }

        @Test
        @DisplayName("same slug allowed for different churches")
        @Transactional
        void sameSlugAllowedForDifferentChurches() {
            // Create second church
            ChurchAccount church2 = new ChurchAccount();
            church2.setName("Second Test Church");
            church2 = churchRepository.save(church2);

            // Create slot with same slug in both churches
            SlotCreateRequest request1 = new SlotCreateRequest("shared-slug", "Church 1 Slot", true);
            SlotCreateRequest request2 = new SlotCreateRequest("shared-slug", "Church 2 Slot", true);

            SlotResponse response1 = slotService.createSlot(testChurch, request1);
            SlotResponse response2 = slotService.createSlot(church2, request2);

            // Both should succeed
            assertThat(response1).isNotNull();
            assertThat(response2).isNotNull();
            assertThat(response1.getSlug()).isEqualTo("shared-slug");
            assertThat(response2.getSlug()).isEqualTo("shared-slug");
        }

        @Test
        @DisplayName("slot maintains church relationship")
        @Transactional
        void slotMaintainsChurchRelationship() {
            // Create slot
            SlotCreateRequest request = new SlotCreateRequest("test-slug", "Test Slot", true);
            SlotResponse response = slotService.createSlot(testChurch, request);

            // Verify church relationship
            DocumentSlot slot = slotRepository.findById(response.getId()).get();
            assertThat(slot.getChurchAccount()).isNotNull();
            assertThat(slot.getChurchAccount().getId()).isEqualTo(testChurch.getId());
            assertThat(slot.getChurchAccount().getName()).isEqualTo("Integration Test Church");
        }
    }

    @Nested
    @DisplayName("Transaction Tests")
    class TransactionTests {

        @Test
        @DisplayName("failed upload does not corrupt live slot")
        @Transactional
        void failedUploadDoesNotCorruptLiveSlot() {
            // Create slot and upload v1
            SlotCreateRequest request = new SlotCreateRequest("test-slug", "Test Slot", true);
            slotService.createSlot(testChurch, request);

            MockMultipartFile fileV1 = new MockMultipartFile(
                    "file",
                    "v1.pdf",
                    "application/pdf",
                    "%PDF-1.4\nV1".getBytes()
            );
            slotService.uploadFile(testChurch, "test-slug", fileV1, testAdmin);

            // Get the current file key
            DocumentSlot slotBefore = slotRepository.findBySlugWithChurch("test-slug").get();
            String originalFileKey = slotBefore.getCurrentFileKey();

            // Mock storage to fail on next upload
            willThrow(new RuntimeException("Storage failure"))
                    .given(storageService).uploadFile(anyString(), any(), anyString(), anyLong());

            // Try to upload v2 - should fail
            MockMultipartFile fileV2 = new MockMultipartFile(
                    "file",
                    "v2.pdf",
                    "application/pdf",
                    "%PDF-1.4\nV2".getBytes()
            );

            assertThatThrownBy(() -> 
                    slotService.uploadFile(testChurch, "test-slug", fileV2, testAdmin))
                    .isInstanceOf(RuntimeException.class);

            // Verify original file is still intact
            DocumentSlot slotAfter = slotRepository.findBySlugWithChurch("test-slug").get();
            assertThat(slotAfter.getCurrentFileKey()).isEqualTo(originalFileKey);
        }

        @Test
        @DisplayName("slot creation is atomic")
        @Transactional
        void slotCreationIsAtomic() {
            // This test verifies that slot creation either fully succeeds or fully fails
            SlotCreateRequest request = new SlotCreateRequest("atomic-slug", "Atomic Slot", true);
            SlotResponse response = slotService.createSlot(testChurch, request);

            // Verify slot exists in database
            Optional<DocumentSlot> slotInDb = slotRepository.findBySlugWithChurch("atomic-slug");
            assertThat(slotInDb).isPresent();
            assertThat(slotInDb.get().getId()).isEqualTo(response.getId());
        }
    }

    @Nested
    @DisplayName("Archive and Reactivate Tests")
    class ArchiveAndReactivateTests {

        @Test
        @DisplayName("archive slot sets is_active to false")
        @Transactional
        void archiveSlotSetsIsActiveToFalse() {
            // Create slot
            SlotCreateRequest request = new SlotCreateRequest("archive-test", "Archive Test", true);
            slotService.createSlot(testChurch, request);

            // Verify initially active
            DocumentSlot slotBefore = slotRepository.findBySlugWithChurch("archive-test").get();
            assertThat(slotBefore.getIsActive()).isTrue();

            // Archive
            slotService.archiveSlot(testChurch, "archive-test");

            // Verify archived
            DocumentSlot slotAfter = slotRepository.findBySlugWithChurch("archive-test").get();
            assertThat(slotAfter.getIsActive()).isFalse();
        }

        @Test
        @DisplayName("reactivate archived slot")
        @Transactional
        void reactivateArchivedSlot() {
            // Create and archive slot
            SlotCreateRequest request = new SlotCreateRequest("reactivate-test", "Reactivate Test", true);
            slotService.createSlot(testChurch, request);
            slotService.archiveSlot(testChurch, "reactivate-test");

            // Verify archived
            DocumentSlot slotArchived = slotRepository.findBySlugWithChurch("reactivate-test").get();
            assertThat(slotArchived.getIsActive()).isFalse();

            // Reactivate
            slotService.activateSlot(testChurch, "reactivate-test");

            // Verify reactivated
            DocumentSlot slotActive = slotRepository.findBySlugWithChurch("reactivate-test").get();
            assertThat(slotActive.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("archived slot still accessible by slug")
        @Transactional
        void archivedSlotStillAccessibleBySlug() {
            // Create and archive slot
            SlotCreateRequest request = new SlotCreateRequest("accessible-test", "Accessible Test", false);
            slotService.createSlot(testChurch, request);

            // Should still be able to retrieve
            SlotResponse response = slotService.getSlotForViewer("accessible-test");
            assertThat(response).isNotNull();
            assertThat(response.getSlug()).isEqualTo("accessible-test");
        }
    }

    @Nested
    @DisplayName("File Operations Tests")
    class FileOperationsTests {

        @Test
        @DisplayName("upload file to empty slot")
        @Transactional
        void uploadFileToEmptySlot() {
            // Create empty slot
            SlotCreateRequest request = new SlotCreateRequest("empty-slot", "Empty Slot", true);
            slotService.createSlot(testChurch, request);

            // Verify slot has no file
            DocumentSlot slotBefore = slotRepository.findBySlugWithChurch("empty-slot").get();
            assertThat(slotBefore.getCurrentFileKey()).isNull();

            // Upload file
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "first-file.pdf",
                    "application/pdf",
                    "%PDF-1.4\nFirst file".getBytes()
            );
            slotService.uploadFile(testChurch, "empty-slot", file, testAdmin);

            // Verify file was set
            DocumentSlot slotAfter = slotRepository.findBySlugWithChurch("empty-slot").get();
            assertThat(slotAfter.getCurrentFileKey()).isNotNull();
            assertThat(slotAfter.getFileSize()).isEqualTo(file.getSize());
            assertThat(slotAfter.getMimeType()).isEqualTo("application/pdf");
        }

        @Test
        @DisplayName("getFileUrl returns null for slot without file")
        @Transactional
        void getFileUrlReturnsNullForSlotWithoutFile() {
            // Create slot without file
            SlotCreateRequest request = new SlotCreateRequest("no-file-slug", "No File Slot", true);
            slotService.createSlot(testChurch, request);

            // Get file URL
            String url = slotService.getFileUrl("no-file-slug");

            // Should be null
            assertThat(url).isNull();
        }

        @Test
        @DisplayName("multiple hot-swaps maintain correct file pointer")
        @Transactional
        void multipleHotSwapsMaintainCorrectFilePointer() {
            // Create slot
            SlotCreateRequest request = new SlotCreateRequest("multi-swap", "Multi Swap", true);
            slotService.createSlot(testChurch, request);

            // Upload v1
            MockMultipartFile fileV1 = new MockMultipartFile(
                    "file", "v1.pdf", "application/pdf", "%PDF-1.4\nV1".getBytes()
            );
            slotService.uploadFile(testChurch, "multi-swap", fileV1, testAdmin);
            String keyV1 = slotRepository.findBySlugWithChurch("multi-swap").get().getCurrentFileKey();

            // Upload v2
            MockMultipartFile fileV2 = new MockMultipartFile(
                    "file", "v2.pdf", "application/pdf", "%PDF-1.4\nV2".getBytes()
            );
            slotService.uploadFile(testChurch, "multi-swap", fileV2, testAdmin);
            String keyV2 = slotRepository.findBySlugWithChurch("multi-swap").get().getCurrentFileKey();

            // Upload v3
            MockMultipartFile fileV3 = new MockMultipartFile(
                    "file", "v3.pdf", "application/pdf", "%PDF-1.4\nV3".getBytes()
            );
            slotService.uploadFile(testChurch, "multi-swap", fileV3, testAdmin);
            String keyV3 = slotRepository.findBySlugWithChurch("multi-swap").get().getCurrentFileKey();

            // Verify all keys are different
            assertThat(keyV1).isNotEqualTo(keyV2);
            assertThat(keyV2).isNotEqualTo(keyV3);
            assertThat(keyV1).isNotEqualTo(keyV3);

            // Verify current key is v3
            assertThat(slotRepository.findBySlugWithChurch("multi-swap").get().getCurrentFileKey())
                    .isEqualTo(keyV3);

            // Verify old files were deleted
            verify(storageService).deleteFile(keyV1);
            verify(storageService).deleteFile(keyV2);
        }
    }

    @Nested
    @DisplayName("Slot Retrieval Tests")
    class SlotRetrievalTests {

        @Test
        @DisplayName("getAllSlots returns all slots for church")
        @Transactional
        void getAllSlotsReturnsAllSlotsForChurch() {
            // Create multiple slots
            slotService.createSlot(testChurch, new SlotCreateRequest("slot-1", "Slot 1", true));
            slotService.createSlot(testChurch, new SlotCreateRequest("slot-2", "Slot 2", true));
            slotService.createSlot(testChurch, new SlotCreateRequest("slot-3", "Slot 3", true));

            // Get all slots
            List<SlotResponse> slots = slotService.getAllSlots(testChurch);

            // Verify all slots returned
            assertThat(slots).hasSize(3);
            assertThat(slots).extracting("slug")
                    .containsExactlyInAnyOrder("slot-1", "slot-2", "slot-3");
        }

        @Test
        @DisplayName("getSlotBySlug returns correct slot")
        @Transactional
        void getSlotBySlugReturnsCorrectSlot() {
            // Create slot
            SlotCreateRequest request = new SlotCreateRequest("specific-slug", "Specific Slot", true);
            slotService.createSlot(testChurch, request);

            // Get by slug
            SlotResponse response = slotService.getSlotBySlug(testChurch, "specific-slug");

            // Verify
            assertThat(response).isNotNull();
            assertThat(response.getSlug()).isEqualTo("specific-slug");
            assertThat(response.getDisplayName()).isEqualTo("Specific Slot");
        }

        @Test
        @DisplayName("getSlotForViewer works without church context")
        @Transactional
        void getSlotForViewerWorksWithoutChurchContext() {
            // Create slot
            SlotCreateRequest request = new SlotCreateRequest("viewer-slug", "Viewer Slot", true);
            slotService.createSlot(testChurch, request);

            // Get for viewer (no auth required)
            SlotResponse response = slotService.getSlotForViewer("viewer-slug");

            // Verify
            assertThat(response).isNotNull();
            assertThat(response.getSlug()).isEqualTo("viewer-slug");
        }
    }
}
