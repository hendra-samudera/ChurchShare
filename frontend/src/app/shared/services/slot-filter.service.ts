import { Injectable } from '@angular/core';
import { Slot, SlotCategory, SlotStatus } from '@models/slot.model';

export interface FilterOptions {
  searchQuery?: string;
  category?: SlotCategory | '';
  status?: SlotStatus | '';
}

@Injectable({ providedIn: 'root' })
export class SlotFilterService {
  /**
   * Filter slots based on search query and filters
   * Performs case-insensitive search across name, description, and category
   */
  filter(slots: Slot[], options: FilterOptions): Slot[] {
    let result = slots;

    // Search filter
    const query = options.searchQuery?.toLowerCase().trim();
    if (query) {
      result = result.filter(slot =>
        slot.displayName.toLowerCase().includes(query) ||
        slot.description?.toLowerCase().includes(query) ||
        slot.category.toLowerCase().includes(query) ||
        slot.slug.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (options.category) {
      result = result.filter(slot => slot.category === options.category);
    }

    // Status filter
    if (options.status) {
      result = result.filter(slot => slot.status === options.status);
    }

    return result;
  }

  /**
   * Get count of filtered slots
   */
  getCount(slots: Slot[], options: FilterOptions): number {
    return this.filter(slots, options).length;
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(options: FilterOptions): boolean {
    return !!(options.searchQuery || options.category || options.status);
  }

  /**
   * Clear all filters
   */
  clearFilters(): FilterOptions {
    return {
      searchQuery: '',
      category: '',
      status: '',
    };
  }
}
