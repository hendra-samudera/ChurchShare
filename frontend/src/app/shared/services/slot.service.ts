import { Injectable, inject } from '@angular/core';
import { MockDataService, Slot } from './mock-data.service';

export interface CreateSlotRequest {
  displayName: string;
  slug: string;
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
      isActive: true,
      hasFile: false,
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
  async updateSlot(id: string, displayName: string): Promise<{ slot: Slot; error?: string }> {
    await this.mockData.simulateDelay(300);

    if (!displayName || displayName.length < 3) {
      return { 
        slot: {} as Slot, 
        error: 'Name must be at least 3 characters' 
      };
    }

    const updated = this.mockData.updateSlot(id, { displayName });
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
    this.mockData.updateSlot(id, { isActive: false });
  }

  /**
   * Reactivate an archived slot
   */
  async reactivateSlot(id: string): Promise<Slot | undefined> {
    await this.mockData.simulateDelay(300);
    return this.mockData.updateSlot(id, { isActive: true });
  }
}
