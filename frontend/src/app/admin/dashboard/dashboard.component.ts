import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Slot, SlotCategory, SlotStatus, DashboardStats } from '@models/slot.model';
import { SlotService } from '@services/slot.service';
import { MockDataService } from '@services/mock-data.service';
import { ClipboardService } from '@services/clipboard.service';
import { SidebarNavigationComponent } from '../layout/sidebar-navigation/sidebar-navigation.component';
import { HeaderBarComponent } from '../layout/header-bar/header-bar.component';
import { SummaryStatsRowComponent } from '../layout/summary-stats-row/summary-stats-row.component';
import { SlotToolbarComponent, ViewMode } from '../layout/slot-toolbar/slot-toolbar.component';
import { SlotCardGridComponent } from '../layout/slot-card-grid/slot-card-grid.component';
import { SlotCardListComponent } from '../layout/slot-card-list/slot-card-list.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { ThreeDotMenuComponent } from '@shared/ui/three-dot-menu/three-dot-menu.component';

type MenuAction = 'rename' | 'archive' | 'copy' | 'qr' | 'delete';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarNavigationComponent,
    HeaderBarComponent,
    SummaryStatsRowComponent,
    SlotToolbarComponent,
    SlotCardGridComponent,
    SlotCardListComponent,
    ButtonComponent,
    SpinnerComponent,
  ],
  template: `
    @if (isChildRoute()) {
      <!-- Child route handles its own layout -->
      <router-outlet />
    } @else {
      <!-- Dashboard Layout -->
      <div class="dashboard-layout">
        <!-- Sidebar Navigation -->
        <app-sidebar-navigation />

        <!-- Main Content Area -->
        <div class="main-content">
          <!-- Header Bar -->
          <app-header-bar breadcrumb="Grace Community Church" />

          <!-- Page Content -->
          <main class="page-main">
            <!-- Page Title -->
            <div class="page-header">
              <div class="page-title-group">
                <h1 class="page-title">Dashboard</h1>
                <p class="page-subtitle">Manage your document slots</p>
              </div>
            </div>

            <!-- Loading State -->
            @if (isLoading()) {
              <div class="loading-state" role="status" aria-live="polite">
                <app-spinner text="Loading dashboard..." />
              </div>
            }

            <!-- Dashboard Content -->
            @else {
              <!-- Summary Statistics -->
              <app-summary-stats-row [stats]="stats()" />

              <!-- Toolbar -->
              <app-slot-toolbar
                [searchQuery]="searchQuery()"
                [selectedCategory]="selectedCategory()"
                [selectedStatus]="selectedStatus()"
                [viewMode]="viewMode()"
                [showingCount]="filteredSlots().length"
                [totalCount]="slots().length"
                [categories]="categories()"
                [statuses]="statuses()"
                (searchInput)="onSearchInput($event)"
                (categoryChange)="onCategoryChange($event)"
                (statusChange)="onStatusChange($event)"
                (viewModeChange)="onViewModeChange($event)" />

              <!-- Empty State -->
              @if (filteredSlots().length === 0) {
                <div class="empty-state">
                  <div class="empty-state-icon" aria-hidden="true">📁</div>
                  <h2 class="empty-state-title">No slots found</h2>
                  <p class="empty-state-description">
                    @if (searchQuery() || selectedCategory() || selectedStatus()) {
                      Try adjusting your search or filters
                    } @else {
                      Create your first slot to get started
                    }
                  </p>
                  @if (!searchQuery() && !selectedCategory() && !selectedStatus()) {
                    <app-button
                      variant="primary"
                      (clicked)="onCreateSlot()">
                      Create Your First Slot
                    </app-button>
                  }
                </div>
              } @else {
                <!-- Slot Grid/List -->
                @if (viewMode() === 'grid') {
                  <app-slot-card-grid
                    [slots]="filteredSlots()"
                    [uploadingSlotId]="uploadingSlotId()"
                    [uploadProgress]="uploadProgress()"
                    (uploadClick)="onUploadClick($event)"
                    (previewClick)="onPreviewClick($event)"
                    (copyLinkClick)="onCopyLinkClick($event)"
                    (menuAction)="onMenuAction($event)" />
                } @else {
                  <app-slot-card-list
                    [slots]="filteredSlots()"
                    [uploadingSlotId]="uploadingSlotId()"
                    [uploadProgress]="uploadProgress()"
                    (uploadClick)="onUploadClick($event)"
                    (previewClick)="onPreviewClick($event)"
                    (copyLinkClick)="onCopyLinkClick($event)"
                    (menuAction)="onMenuAction($event)" />
                }
              }
            }
          </main>
        </div>
      </div>

      <!-- Delete Confirmation Dialog -->
      @if (showDeleteDialog()) {
        <div class="dialog-backdrop" (click)="cancelDelete()">
          <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
            <h2 id="dialog-title" class="dialog-title">Delete Slot?</h2>
            <p class="dialog-description">
              This action cannot be undone. The permanent link will no longer work.
            </p>
            <div class="dialog-actions">
              <app-button variant="secondary" (clicked)="cancelDelete()">Cancel</app-button>
              <app-button variant="danger" (clicked)="confirmDelete()">Delete</app-button>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      margin-left: 280px;
      display: flex;
      flex-direction: column;
    }

    .page-main {
      flex: 1;
      padding: 24px;
      margin-top: 64px;
      background-color: var(--color-surface);
      min-height: calc(100vh - 64px);
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .page-title-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }

    .page-subtitle {
      font-size: 1rem;
      color: var(--color-text-secondary);
      margin: 0;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      background-color: var(--color-background);
      border-radius: var(--radius-lg);
      text-align: center;
    }

    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 16px;
    }

    .empty-state-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 8px 0;
    }

    .empty-state-description {
      font-size: 1rem;
      color: var(--color-text-secondary);
      margin: 0 0 24px 0;
      max-width: 400px;
    }

    /* Delete Dialog */
    .dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog {
      background-color: var(--color-background);
      border-radius: var(--radius-lg);
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: var(--shadow-2xl);
    }

    .dialog-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 12px 0;
    }

    .dialog-description {
      font-size: 1rem;
      color: var(--color-text-secondary);
      margin: 0 0 24px 0;
    }

    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .main-content {
        margin-left: 72px;
      }

      .page-main {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
      }

      .page-title {
        font-size: 1.5rem;
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly slotService = inject(SlotService);
  private readonly mockData = inject(MockDataService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly router = inject(Router);

  readonly slots = signal<Slot[]>([]);
  readonly stats = signal<DashboardStats>({
    totalSlots: 0,
    activeSlots: 0,
    slotsWithFiles: 0,
    totalViews: 0,
  });
  readonly isLoading = signal(true);

  // Filter state
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<SlotCategory | ''>('');
  readonly selectedStatus = signal<SlotStatus | ''>('');
  readonly viewMode = signal<ViewMode>('grid');

  // Upload state
  readonly uploadingSlotId = signal<string | null>(null);
  readonly uploadProgress = signal<number>(0);

  // Delete dialog state
  readonly showDeleteDialog = signal(false);
  readonly slotToDelete = signal<string | null>(null);

  // Computed filtered slots
  readonly filteredSlots = computed(() => {
    let result = this.slots();

    // Search filter
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      result = result.filter(slot =>
        slot.displayName.toLowerCase().includes(query) ||
        slot.description?.toLowerCase().includes(query) ||
        slot.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (this.selectedCategory()) {
      result = result.filter(slot => slot.category === this.selectedCategory());
    }

    // Status filter
    if (this.selectedStatus()) {
      result = result.filter(slot => slot.status === this.selectedStatus());
    }

    return result;
  });

  readonly categories = computed(() => this.slotService.getCategories());
  readonly statuses = computed(() => this.slotService.getStatuses());

  // Check if we're on a child route (new-slot page)
  readonly isChildRoute = computed(() => {
    const url = this.router.url;
    return url.includes('/new-slot');
  });

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [slots, stats] = await Promise.all([
        this.slotService.getSlots(),
        this.slotService.getDashboardStats(),
      ]);
      this.slots.set(slots);
      this.stats.set(stats);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  onSearchInput(query: string): void {
    this.searchQuery.set(query);
  }

  onCategoryChange(category: SlotCategory | ''): void {
    this.selectedCategory.set(category);
  }

  onStatusChange(status: SlotStatus | ''): void {
    this.selectedStatus.set(status);
  }

  onViewModeChange(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  onCreateSlot(): void {
    this.router.navigate(['/admin/dashboard/new-slot']);
  }

  onUploadClick(slotId: string): void {
    this.router.navigate(['/admin/upload', slotId]);
  }

  onPreviewClick(slug: string): void {
    window.open(`/view/${slug}`, '_blank');
  }

  async onCopyLinkClick(url: string): Promise<void> {
    const success = await this.clipboardService.copy(url);
    if (success) {
      // Could show a toast notification here
      console.log('Link copied to clipboard');
    }
  }

  onMenuAction(event: { action: string; slotId: string }): void {
    const { action, slotId } = event;

    switch (action) {
      case 'rename':
        this.handleRename(slotId);
        break;
      case 'archive':
        this.handleArchive(slotId);
        break;
      case 'copy':
        this.handleCopyLink(slotId);
        break;
      case 'qr':
        // Greyed out in v1.0
        break;
      case 'delete':
        this.slotToDelete.set(slotId);
        this.showDeleteDialog.set(true);
        break;
    }
  }

  private handleRename(slotId: string): void {
    // TODO: Implement rename dialog
    console.log('Rename slot:', slotId);
  }

  private async handleArchive(slotId: string): Promise<void> {
    try {
      await this.slotService.archiveSlot(slotId);
      await this.loadDashboard();
    } catch (error) {
      console.error('Failed to archive slot:', error);
    }
  }

  private async handleCopyLink(slotId: string): Promise<void> {
    const slot = this.slots().find(s => s.id === slotId);
    if (slot) {
      await this.onCopyLinkClick(slot.permanentUrl);
    }
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.slotToDelete.set(null);
  }

  async confirmDelete(): Promise<void> {
    const slotId = this.slotToDelete();
    if (slotId) {
      try {
        await this.slotService.deleteSlot(slotId);
        await this.loadDashboard();
      } catch (error) {
        console.error('Failed to delete slot:', error);
      }
    }
    this.cancelDelete();
  }
}
