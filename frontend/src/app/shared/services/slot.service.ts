import { Injectable, inject } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { Slot, SlotCategory, SlotStatus, DashboardStats, CreateSlotRequest } from '@models/slot.model';

export interface UpdateSlotRequest {
  displayName?: string;
  category?: SlotCategory;
  description?: string;
  status?: SlotStatus;
}

@Injectable({ providedIn: 'root' })
export class SlotService {
  private readonly mockData = inject(MockDataService);

  /**
   * Get all slots
   */
  async getSlots(): Promise<Slot[]> {
    await this.mockData.simulateDelay(300);
    return this.mockData.slots();
  }

  /**
   * Get dashboard summary statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    await this.mockData.simulateDelay(200);
    return this.mockData.stats();
  }

  /**
   * Get single slot by ID
   */
  async getSlotById(id: string): Promise<Slot | undefined> {
    await this.mockData.simulateDelay(200);
    return this.mockData.getSlotById(id);
  }

  /**
   * Get single slot by slug (public endpoint)
   */
  async getSlotBySlug(slug: string): Promise<Slot | undefined> {
    await this.mockData.simulateDelay(200);
    return this.mockData.getSlotBySlug(slug);
  }

  /**
   * Create a new slot
   */
  async createSlot(request: CreateSlotRequest): Promise<{ slot: Slot; error?: string }> {
    await this.mockData.simulateDelay(500);

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(request.slug)) {
      return {
        slot: {} as Slot,
        error: 'Slug must contain only lowercase letters, numbers, and hyphens'
      };
    }

    // Check if slug already exists
    const existing = this.mockData.getSlotBySlug(request.slug);
    if (existing) {
      return {
        slot: {} as Slot,
        error: 'This URL is already taken. Please choose another.'
      };
    }

    const newSlot = this.mockData.addSlot({
      displayName: request.displayName,
      slug: request.slug,
      isActive: request.status !== SlotStatus.Draft,
      hasFile: false,
      category: request.category || SlotCategory.Announcements,
      description: request.description || '',
      status: request.status || SlotStatus.Active,
    });

    return { slot: newSlot };
  }

  /**
   * Check if a slug already exists
   */
  async checkSlugExists(slug: string): Promise<boolean> {
    await this.mockData.simulateDelay(200);
    const slot = this.mockData.getSlotBySlug(slug);
    return !!slot;
  }

  /**
   * Update slot metadata
   */
  async updateSlot(id: string, updates: UpdateSlotRequest): Promise<{ slot: Slot; error?: string }> {
    await this.mockData.simulateDelay(300);

    if (updates.displayName && updates.displayName.length < 3) {
      return {
        slot: {} as Slot,
        error: 'Name must be at least 3 characters'
      };
    }

    const updated = this.mockData.updateSlot(id, updates);
    if (!updated) {
      return { slot: {} as Slot, error: 'Slot not found' };
    }

    return { slot: updated };
  }

  /**
   * Archive (deactivate) a slot
   */
  async archiveSlot(id: string): Promise<void> {
    await this.mockData.simulateDelay(300);
    this.mockData.updateSlot(id, { status: SlotStatus.Archived, isActive: false });
  }

  /**
   * Reactivate an archived slot
   */
  async reactivateSlot(id: string): Promise<Slot | undefined> {
    await this.mockData.simulateDelay(300);
    return this.mockData.updateSlot(id, { status: SlotStatus.Active, isActive: true });
  }

  /**
   * Delete a slot permanently
   */
  async deleteSlot(id: string): Promise<boolean> {
    await this.mockData.simulateDelay(300);
    return this.mockData.deleteSlot(id);
  }

  /**
   * Increment view count for a slot
   */
  async incrementViewCount(id: string): Promise<void> {
    const slot = this.mockData.getSlotById(id);
    if (slot) {
      this.mockData.updateSlot(id, { viewCount: (slot.viewCount || 0) + 1 });
    }
  }

  /**
   * Get all available categories
   */
  getCategories(): SlotCategory[] {
    return Object.values(SlotCategory);
  }

  /**
   * Get all available statuses
   */
  getStatuses(): SlotStatus[] {
    return Object.values(SlotStatus);
  }
}
