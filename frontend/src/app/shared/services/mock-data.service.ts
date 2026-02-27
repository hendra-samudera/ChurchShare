import { Injectable, signal, computed } from '@angular/core';
import { Slot, SlotCategory, SlotStatus, User, DashboardStats } from '@models/slot.model';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private readonly mockUser: User = {
    id: '1',
    email: 'admin@churchshare.app',
    displayName: 'Sister Maria',
    role: 'Administrator',
    avatarInitials: 'SM',
  };

  private readonly mockSlots = signal<Slot[]>([
    {
      id: '1',
      displayName: 'Weekly Liturgy',
      slug: 'weekly-liturgy',
      permanentUrl: 'http://localhost:4200/view/weekly-liturgy',
      lastUpdatedAt: '2025-06-15T08:30:00Z',
      lastUpdatedBy: 'Sister Maria',
      isActive: true,
      hasFile: true,
      fileSize: 245678,
      originalFilename: 'liturgy-june-15.pdf',
      category: SlotCategory.Bulletin,
      description: 'Sunday service order of worship and announcements',
      status: SlotStatus.Active,
      viewCount: 245,
    },
    {
      id: '2',
      displayName: 'Sunday Bulletin',
      slug: 'sunday-bulletin',
      permanentUrl: 'http://localhost:4200/view/sunday-bulletin',
      lastUpdatedAt: '2025-06-08T09:15:00Z',
      lastUpdatedBy: 'Sister Maria',
      isActive: true,
      hasFile: true,
      fileSize: 512340,
      originalFilename: 'bulletin-june-8.pdf',
      category: SlotCategory.Bulletin,
      description: 'Weekly church bulletin with service details',
      status: SlotStatus.Active,
      viewCount: 312,
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
      category: SlotCategory.SermonNotes,
      description: 'Monthly prayer topics and intercessions',
      status: SlotStatus.Draft,
      viewCount: 0,
    },
    {
      id: '4',
      displayName: 'Youth Group Announcements',
      slug: 'youth-announcements',
      permanentUrl: 'http://localhost:4200/view/youth-announcements',
      lastUpdatedAt: '2025-06-01T14:00:00Z',
      lastUpdatedBy: 'Sister Maria',
      isActive: true,
      hasFile: true,
      fileSize: 128456,
      originalFilename: 'youth-june.pdf',
      category: SlotCategory.Announcements,
      description: 'Youth group events and meeting schedules',
      status: SlotStatus.Active,
      viewCount: 89,
    },
    {
      id: '5',
      displayName: 'Church Newsletter',
      slug: 'church-newsletter',
      permanentUrl: 'http://localhost:4200/view/church-newsletter',
      lastUpdatedAt: '2025-05-28T10:00:00Z',
      lastUpdatedBy: 'Sister Maria',
      isActive: true,
      hasFile: true,
      fileSize: 892341,
      originalFilename: 'newsletter-may-2025.pdf',
      category: SlotCategory.Newsletter,
      description: 'Monthly community newsletter',
      status: SlotStatus.Active,
      viewCount: 178,
    },
    {
      id: '6',
      displayName: 'Volunteer Registration Form',
      slug: 'volunteer-form',
      permanentUrl: 'http://localhost:4200/view/volunteer-form',
      lastUpdatedAt: '2025-04-15T11:30:00Z',
      lastUpdatedBy: 'Sister Maria',
      isActive: true,
      hasFile: true,
      fileSize: 156789,
      originalFilename: 'volunteer-registration.pdf',
      category: SlotCategory.Forms,
      description: 'Form for new volunteers to register',
      status: SlotStatus.Active,
      viewCount: 67,
    },
    {
      id: '7',
      displayName: 'Christmas Eve Service',
      slug: 'christmas-eve',
      permanentUrl: 'http://localhost:4200/view/christmas-eve',
      lastUpdatedAt: '2024-12-20T16:00:00Z',
      lastUpdatedBy: 'Sister Maria',
      isActive: false,
      hasFile: true,
      fileSize: 234567,
      originalFilename: 'christmas-eve-2024.pdf',
      category: SlotCategory.Events,
      description: 'Annual Christmas Eve service program',
      status: SlotStatus.Archived,
      viewCount: 421,
    },
    {
      id: '8',
      displayName: 'Easter Sunday Liturgy',
      slug: 'easter-liturgy',
      permanentUrl: 'http://localhost:4200/view/easter-liturgy',
      lastUpdatedAt: null,
      lastUpdatedBy: null,
      isActive: true,
      hasFile: false,
      category: SlotCategory.Bulletin,
      description: 'Special Easter Sunday worship service',
      status: SlotStatus.Draft,
      viewCount: 0,
    },
  ]);

  readonly slots = computed(() => this.mockSlots());
  readonly user = computed(() => this.mockUser);

  /**
   * Get dashboard summary statistics
   */
  readonly stats = computed<DashboardStats>(() => {
    const allSlots = this.mockSlots();
    return {
      totalSlots: allSlots.length,
      activeSlots: allSlots.filter(s => s.status === SlotStatus.Active).length,
      slotsWithFiles: allSlots.filter(s => s.hasFile).length,
      totalViews: allSlots.reduce((sum, s) => sum + (s.viewCount || 0), 0),
    };
  });

  getSlotById(id: string): Slot | undefined {
    return this.mockSlots().find(slot => slot.id === id);
  }

  getSlotBySlug(slug: string): Slot | undefined {
    return this.mockSlots().find(slot => slot.slug === slug);
  }

  addSlot(slot: Omit<Slot, 'id' | 'permanentUrl' | 'lastUpdatedAt' | 'lastUpdatedBy' | 'viewCount'>): Slot {
    const newSlot: Slot = {
      ...slot,
      id: String(Date.now()),
      permanentUrl: `http://localhost:4200/view/${slot.slug}`,
      lastUpdatedAt: null,
      lastUpdatedBy: null,
      viewCount: 0,
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

  formatRelativeDate(dateString: string | null): string {
    if (!dateString) return 'Never updated';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return this.formatDate(dateString);
  }
}

// Re-export types for backward compatibility
export type { Slot, User, DashboardStats };
export { SlotCategory, SlotStatus };
