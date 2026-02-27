/**
 * ChurchShare Slot Model
 * Enhanced with PRD v1.1 category tag system and status management
 */

/**
 * Document category for visual organization
 * Each category has a distinct color for quick identification
 */
export enum SlotCategory {
  Bulletin = 'Bulletin',
  Newsletter = 'Newsletter',
  SermonNotes = 'Sermon Notes',
  Forms = 'Forms',
  Events = 'Events',
  Announcements = 'Announcements',
}

/**
 * Slot status for access control
 */
export enum SlotStatus {
  Active = 'Active',
  Draft = 'Draft',
  Archived = 'Archived',
}

/**
 * Category color mappings - meets 4.5:1 contrast ratio
 * Used for category tag backgrounds
 */
export const CATEGORY_COLORS: Record<SlotCategory, string> = {
  [SlotCategory.Bulletin]: '#0f9d58',      // Green
  [SlotCategory.Newsletter]: '#1a73e8',    // Blue
  [SlotCategory.SermonNotes]: '#9334e6',   // Purple
  [SlotCategory.Forms]: '#00897b',         // Teal
  [SlotCategory.Events]: '#f97316',        // Orange
  [SlotCategory.Announcements]: '#84cc16', // Olive
};

/**
 * Status color mappings for status badges
 */
export const STATUS_COLORS: Record<SlotStatus, string> = {
  [SlotStatus.Active]: '#0f9d58',    // Green
  [SlotStatus.Draft]: '#f9ab00',     // Amber
  [SlotStatus.Archived]: '#5f6368',  // Gray
};

/**
 * Enhanced Slot interface with PRD v1.1 fields
 */
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
  // PRD v1.1 new fields
  category: SlotCategory;
  description?: string;
  status: SlotStatus;
  viewCount?: number;
}

/**
 * Summary statistics for dashboard
 */
export interface DashboardStats {
  totalSlots: number;
  activeSlots: number;
  slotsWithFiles: number;
  totalViews: number;
}

/**
 * User interface for sidebar
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  role?: string;
  avatarInitials?: string;
}

/**
 * Request type for creating a slot
 */
export interface CreateSlotRequest {
  displayName: string;
  slug: string;
  category?: SlotCategory;
  description?: string;
  status?: SlotStatus;
}
