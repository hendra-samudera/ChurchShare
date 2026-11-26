import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Slot } from '@models/slot.model';
import { environment } from '@environments/environment';

/**
 * Service for fetching slot data for the public viewer
 * No authentication required
 */
@Injectable({ providedIn: 'root' })
export class SlotFetchService {
  private readonly http = inject(HttpClient);

  /**
   * Fetch slot by slug (public endpoint)
   */
  async fetchSlot(slug: string): Promise<Slot | null> {
    try {
      return await firstValueFrom(
        this.http.get<Slot>(`${environment.apiUrl}/slots/${slug}`)
      );
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Get PDF file download URL for a slot
   */
  getPdfUrl(slot: Slot): string | null {
    if (!slot.hasFile) {
      return null;
    }
    return `${environment.apiUrl}/slots/${slot.slug}/file`;
  }
}
