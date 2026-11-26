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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SlotService {

    private final DocumentSlotRepository documentSlotRepository;

    @Transactional(readOnly = true)
    public List<SlotResponse> getAllSlots(Long churchId) {
        return documentSlotRepository.findByChurchId(churchId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SlotResponse getSlotById(Long id) {
        DocumentSlot slot = documentSlotRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Slot not found with id: " + id));
        return mapToResponse(slot);
    }

    @Transactional(readOnly = true)
    public DocumentSlot getSlotBySlug(Long churchId, String slug) {
        return documentSlotRepository.findByChurchIdAndSlug(churchId, slug)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Slot not found with slug: " + slug + " for church: " + churchId));
    }

    @Transactional(readOnly = true)
    public SlotPublicResponse getPublicSlot(String slug) {
        return documentSlotRepository.findFirstBySlug(slug)
                .filter(slot -> !"DRAFT".equals(slot.getStatus()))
                .map(slot -> new SlotPublicResponse(
                        slot.getSlug(),
                        slot.getDisplayTitle(),
                        slot.getStatus(),
                        slot.getCurrentFileKey() != null,
                        slot.getCategory()
                ))
                .orElse(null);
    }

    @Transactional
    public SlotResponse createSlot(Long churchId, CreateSlotRequest request) {
        documentSlotRepository.findByChurchIdAndSlug(churchId, request.slug())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException(
                            "Slug '" + request.slug() + "' already exists for this church");
                });

        DocumentSlot slot = new DocumentSlot();

        Church church = new Church();
        church.setId(churchId);
        slot.setChurch(church);

        slot.setSlug(request.slug());
        slot.setDisplayTitle(request.displayName());
        slot.setStatus(request.status() != null ? request.status() : "ACTIVE");
        slot.setCategory(request.category() != null ? request.category() : "Announcements");
        slot.setDescription(request.description());

        DocumentSlot saved = documentSlotRepository.save(slot);
        return mapToResponse(saved);
    }

    @Transactional
    public SlotResponse updateSlot(Long id, UpdateSlotRequest request) {
        DocumentSlot slot = documentSlotRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Slot not found with id: " + id));

        if (request.displayName() != null) {
            slot.setDisplayTitle(request.displayName());
        }
        if (request.category() != null) {
            slot.setCategory(request.category());
        }
        if (request.description() != null) {
            slot.setDescription(request.description());
        }
        if (request.status() != null) {
            slot.setStatus(request.status());
        }

        DocumentSlot saved = documentSlotRepository.save(slot);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteSlot(Long id) {
        if (!documentSlotRepository.existsById(id)) {
            throw new EntityNotFoundException("Slot not found with id: " + id);
        }
        documentSlotRepository.deleteById(id);
    }

    @Transactional
    public void archiveSlot(Long id) {
        DocumentSlot slot = documentSlotRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Slot not found with id: " + id));
        slot.setStatus("ARCHIVED");
        documentSlotRepository.save(slot);
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(Long churchId) {
        long totalSlots = documentSlotRepository.countByChurchId(churchId);
        long activeSlots = documentSlotRepository.countByChurchIdAndStatus(churchId, "ACTIVE");
        long slotsWithFiles = documentSlotRepository.countByChurchIdAndCurrentFileKeyIsNotNull(churchId);
        long totalViews = documentSlotRepository.sumViewCountByChurchId(churchId);

        return new DashboardStatsResponse(totalSlots, activeSlots, slotsWithFiles, totalViews);
    }

    @Transactional
    public void incrementViewCount(Long slotId) {
        DocumentSlot slot = documentSlotRepository.findById(slotId)
                .orElseThrow(() -> new EntityNotFoundException("Slot not found with id: " + slotId));
        slot.setViewCount(slot.getViewCount() + 1);
        documentSlotRepository.save(slot);
    }

    public SlotResponse mapToResponse(DocumentSlot slot) {
        return new SlotResponse(
                slot.getId().toString(),
                slot.getDisplayTitle(),
                slot.getSlug(),
                "/view/" + slot.getSlug(),
                slot.getCurrentUploadedAt() != null ? slot.getCurrentUploadedAt().toString() : null,
                null,
                "ACTIVE".equals(slot.getStatus()),
                slot.getCurrentFileKey() != null,
                slot.getCurrentFileSizeBytes(),
                slot.getOriginalFilename(),
                slot.getCategory(),
                slot.getDescription(),
                slot.getStatus(),
                slot.getViewCount()
        );
    }
}
