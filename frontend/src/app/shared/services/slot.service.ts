import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Slot, SlotCategory, SlotStatus, DashboardStats, CreateSlotRequest } from '@models/slot.model';
import { environment } from '@environments/environment';

export interface UpdateSlotRequest {
  displayName?: string;
  category?: SlotCategory;
  description?: string;
  status?: SlotStatus;
}

@Injectable({ providedIn: 'root' })
export class SlotService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/admin/slots`;

  async getSlots(): Promise<Slot[]> {
    try {
      return await firstValueFrom(this.http.get<Slot[]>(this.apiBase));
    } catch (err) {
      throw this.extractError(err);
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await firstValueFrom(
        this.http.get<DashboardStats>(`${this.apiBase}/stats`)
      );
    } catch (err) {
      throw this.extractError(err);
    }
  }

  async getSlotById(id: string): Promise<Slot | undefined> {
    try {
      return await firstValueFrom(
        this.http.get<Slot>(`${this.apiBase}/${id}`)
      );
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        return undefined;
      }
      throw this.extractError(err);
    }
  }

  async createSlot(request: CreateSlotRequest): Promise<{ slot: Slot; error?: string }> {
    try {
      const slot = await firstValueFrom(
        this.http.post<Slot>(this.apiBase, request)
      );
      return { slot };
    } catch (err) {
      return { slot: {} as Slot, error: this.extractError(err) };
    }
  }

  async updateSlot(id: string, updates: UpdateSlotRequest): Promise<{ slot: Slot; error?: string }> {
    try {
      const slot = await firstValueFrom(
        this.http.put<Slot>(`${this.apiBase}/${id}`, updates)
      );
      return { slot };
    } catch (err) {
      return { slot: {} as Slot, error: this.extractError(err) };
    }
  }

  async archiveSlot(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put<void>(`${this.apiBase}/${id}/archive`, {})
      );
    } catch (err) {
      throw this.extractError(err);
    }
  }

  async deleteSlot(id: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.delete<void>(`${this.apiBase}/${id}`)
      );
      return true;
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        return false;
      }
      throw this.extractError(err);
    }
  }

  getCategories(): SlotCategory[] {
    return Object.values(SlotCategory);
  }

  getStatuses(): SlotStatus[] {
    return Object.values(SlotStatus);
  }

  private extractError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message || err.statusText || 'An unexpected error occurred';
    }
    return 'An unexpected error occurred';
  }
}
