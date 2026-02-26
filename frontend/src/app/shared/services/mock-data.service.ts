import { Injectable, signal, computed } from '@angular/core';

export interface Slot {
  id: string;
  displayName: string;
  slug: string;
  permanentUrl: string;
  lastUpdatedAt: string | null;
  lastUpdatedBy: string | null;
  isActive: boolean;
  hasFile: boolean;
  fileSize?: number;
  originalFilename?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
}

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private readonly mockUser: User = {
    id: '1',
    email: 'admin@churchshare.app',
    displayName: 'Admin User',
  };

  private readonly mockSlots = signal<Slot[]>([
    {
      id: '1',
      displayName: 'Weekly Liturgy',
      slug: 'weekly-liturgy',
      permanentUrl: 'http://localhost:4200/view/weekly-liturgy',
      lastUpdatedAt: '2025-06-15T08:30:00Z',
      lastUpdatedBy: 'Admin User',
      isActive: true,
      hasFile: true,
      fileSize: 245678,
      originalFilename: 'liturgy-june-15.pdf',
    },
    {
      id: '2',
      displayName: 'Sunday Bulletin',
      slug: 'sunday-bulletin',
      permanentUrl: 'http://localhost:4200/view/sunday-bulletin',
      lastUpdatedAt: '2025-06-08T09:15:00Z',
      lastUpdatedBy: 'Admin User',
      isActive: true,
      hasFile: true,
      fileSize: 512340,
      originalFilename: 'bulletin-june-8.pdf',
    },
    {
      id: '3',
      displayName: 'Prayer Guide',
      slug: 'prayer-guide',
      permanentUrl: 'http://localhost:4200/view/prayer-guide',
      lastUpdatedAt: null,
      lastUpdatedBy: null,
      isActive: true,
      hasFile: false,
    },
    {
      id: '4',
      displayName: 'Youth Group Announcements',
      slug: 'youth-announcements',
      permanentUrl: 'http://localhost:4200/view/youth-announcements',
      lastUpdatedAt: '2025-06-01T14:00:00Z',
      lastUpdatedBy: 'Admin User',
      isActive: true,
      hasFile: true,
      fileSize: 128456,
      originalFilename: 'youth-june.pdf',
    },
  ]);

  readonly slots = computed(() => this.mockSlots());
  readonly user = computed(() => this.mockUser);

  getSlotById(id: string): Slot | undefined {
    return this.mockSlots().find(slot => slot.id === id);
  }

  getSlotBySlug(slug: string): Slot | undefined {
    return this.mockSlots().find(slot => slot.slug === slug);
  }

  addSlot(slot: Omit<Slot, 'id' | 'permanentUrl' | 'lastUpdatedAt' | 'lastUpdatedBy'>): Slot {
    const newSlot: Slot = {
      ...slot,
      id: String(Date.now()),
      permanentUrl: `http://localhost:4200/view/${slot.slug}`,
      lastUpdatedAt: null,
      lastUpdatedBy: null,
    };
    
    this.mockSlots.update(slots => [...slots, newSlot]);
    return newSlot;
  }

  updateSlot(id: string, updates: Partial<Slot>): Slot | undefined {
    let updatedSlot: Slot | undefined;
    
    this.mockSlots.update(slots => 
      slots.map(slot => {
        if (slot.id === id) {
          updatedSlot = { ...slot, ...updates };
          return updatedSlot;
        }
        return slot;
      })
    );
    
    return updatedSlot;
  }

  deleteSlot(id: string): boolean {
    let deleted = false;
    
    this.mockSlots.update(slots => {
      const filtered = slots.filter(slot => {
        if (slot.id === id) {
          deleted = true;
          return false;
        }
        return true;
      });
      return filtered;
    });
    
    return deleted;
  }

  simulateDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
