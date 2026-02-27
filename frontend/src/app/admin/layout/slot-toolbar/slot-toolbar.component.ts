import { Component, input, output, signal, computed } from '@angular/core';
import { SlotCategory, SlotStatus } from '@models/slot.model';

export type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-slot-toolbar',
  standalone: true,
  template: `
    <section class="toolbar" aria-label="Slot filtering and view options">
      <!-- Search and Filters Row -->
      <div class="toolbar-row">
        <!-- Search Input -->
        <div class="search-container">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            class="search-input"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            placeholder="Search slots..."
            aria-label="Search slots by name, description, or category" />
        </div>

        <!-- Category Filter -->
        <div class="filter-container">
          <select
            class="filter-select"
            [value]="selectedCategory()"
            (change)="onCategoryChange($event)"
            aria-label="Filter by category">
            <option value="">All Categories</option>
            @for (cat of categories(); track cat) {
              <option [value]="cat">{{ cat }}</option>
            }
          </select>
        </div>

        <!-- Status Filter -->
        <div class="filter-container">
          <select
            class="filter-select"
            [value]="selectedStatus()"
            (change)="onStatusChange($event)"
            aria-label="Filter by status">
            <option value="">All Status</option>
            @for (status of statuses(); track status) {
              <option [value]="status">{{ status }}</option>
            }
          </select>
        </div>

        <!-- View Toggle -->
        <div class="view-toggle" role="group" aria-label="View mode">
          <button
            class="view-toggle-btn"
            [class.view-toggle-btn--active]="viewMode() === 'grid'"
            (click)="setViewMode('grid')"
            aria-label="Grid view"
            aria-pressed="viewMode() === 'grid'">
            <span aria-hidden="true">▦</span>
          </button>
          <button
            class="view-toggle-btn"
            [class.view-toggle-btn--active]="viewMode() === 'list'"
            (click)="setViewMode('list')"
            aria-label="List view"
            aria-pressed="viewMode() === 'list'">
            <span aria-hidden="true">☰</span>
          </button>
        </div>
      </div>

      <!-- Results Count -->
      <div class="results-count">
        Showing {{ showingCount() }} of {{ totalCount() }} slots
      </div>
    </section>
  `,
  styles: [`
    .toolbar {
      margin-bottom: 16px;
    }

    .toolbar-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 12px;
    }

    /* Search Input */
    .search-container {
      position: relative;
      flex: 0 0 50%;
      min-width: 280px;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.125rem;
      color: var(--color-text-secondary);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      height: 48px;
      padding: 0 16px 0 48px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 1rem;
      color: var(--color-text-primary);
      background-color: var(--color-background);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }

    .search-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
      outline: none;
    }

    .search-input::placeholder {
      color: var(--color-text-tertiary);
    }

    /* Filter Selects */
    .filter-container {
      min-width: 160px;
    }

    .filter-select {
      width: 100%;
      height: 48px;
      padding: 0 40px 0 16px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 1rem;
      color: var(--color-text-primary);
      background-color: var(--color-background);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%236b7280' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 24px;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
    }

    .filter-select:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
      outline: none;
    }

    /* View Toggle */
    .view-toggle {
      display: flex;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-left: auto;
    }

    .view-toggle-btn {
      width: 48px;
      height: 48px;
      border: none;
      background: var(--color-background);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: var(--color-text-secondary);
      transition: background-color var(--transition-fast), color var(--transition-fast);
    }

    .view-toggle-btn:hover {
      background-color: var(--color-surface);
    }

    .view-toggle-btn--active {
      background-color: var(--color-primary);
      color: var(--color-text-on-dark);
    }

    /* Results Count */
    .results-count {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .toolbar-row {
        flex-wrap: wrap;
      }

      .search-container {
        flex: 1 1 100%;
        min-width: auto;
      }

      .filter-container {
        flex: 1;
        min-width: 140px;
      }

      .view-toggle {
        margin-left: 0;
      }
    }

    @media (max-width: 640px) {
      .filter-container {
        flex: 1 1 100%;
      }

      .view-toggle {
        width: 100%;
        justify-content: center;
      }

      .view-toggle-btn {
        flex: 1;
        max-width: 120px;
      }
    }
  `],
})
export class SlotToolbarComponent {
  searchQuery = input<string>('');
  selectedCategory = input<SlotCategory | ''>('');
  selectedStatus = input<SlotStatus | ''>('');
  viewMode = input<ViewMode>('grid');
  showingCount = input<number>(0);
  totalCount = input<number>(0);

  categories = input<SlotCategory[]>([]);
  statuses = input<SlotStatus[]>([]);

  searchInput = output<string>();
  categoryChange = output<SlotCategory | ''>();
  statusChange = output<SlotStatus | ''>();
  viewModeChange = output<ViewMode>();

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput.emit(value);
  }

  onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as SlotCategory | '';
    this.categoryChange.emit(value);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as SlotStatus | '';
    this.statusChange.emit(value);
  }

  setViewMode(mode: ViewMode): void {
    this.viewModeChange.emit(mode);
  }
}
