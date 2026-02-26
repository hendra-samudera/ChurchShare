import { Injectable, inject } from '@angular/core';
import { Slot } from './mock-data.service';
import { MockDataService } from './mock-data.service';

/**
 * Service for fetching slot data for the public viewer
 * No authentication required
 */
@Injectable({ providedIn: 'root' })
export class SlotFetchService {
  private readonly mockData = inject(MockDataService);

  /**
   * Fetch slot by slug (public endpoint)
   */
  async fetchSlot(slug: string): Promise<Slot | null> {
    // Simulate network delay
    await this.mockData.simulateDelay(500);

    const slot = this.mockData.getSlotBySlug(slug);
    
    if (!slot) {
      return null;
    }

    return slot;
  }

  /**
   * Get PDF file URL for a slot
   * In real implementation, this would return a presigned URL from backend
   */
  getPdfUrl(slot: Slot): string | null {
    if (!slot.hasFile) {
      return null;
    }

    // For demo purposes, return a sample PDF URL
    // In production, this would be: /api/v1/slots/{slug}/file
    return 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2a1d6c08d7f0f6e0c8f8e0e0e0e0e0e0e0e0e0/web/compressed.tracemonkey-pldi-09.pdf';
  }
}
