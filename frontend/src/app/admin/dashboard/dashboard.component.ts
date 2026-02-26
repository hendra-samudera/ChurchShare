import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Slot } from '@services/mock-data.service';
import { SlotService } from '@services/slot.service';
import { AuthService } from '@services/auth.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { CardComponent } from '@shared/ui/card/card.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ButtonComponent, CardComponent, SpinnerComponent],
  template: `
    <main class="dashboard-container">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-content">
          <h1 class="dashboard-title">My Document Slots</h1>
          <app-button
            variant="secondary"
            (clicked)="onLogout()">
            Logout
          </app-button>
        </div>
      </header>

      <!-- Content -->
      <section class="dashboard-content">
        <!-- Create New Slot Button -->
        <div class="action-bar">
          <app-button
            variant="primary"
            (clicked)="onCreateSlot()">
            <span aria-hidden="true">+</span>
            Create New Slot
          </app-button>
        </div>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="loading-state" role="status" aria-live="polite">
            <app-spinner text="Loading your slots..." />
          </div>
        }

        <!-- Empty State -->
        @else if (slots().length === 0) {
          <div class="empty-state">
            <div class="empty-icon" aria-hidden="true">📁</div>
            <h2 class="empty-title">No document slots yet</h2>
            <p class="empty-description">
              Create your first slot to get started
            </p>
            <app-button
              variant="primary"
              (clicked)="onCreateSlot()">
              Create Your First Slot
            </app-button>
          </div>
        }

        <!-- Slot List -->
        @else {
          <div class="slot-list" role="list">
            @for (slot of slots(); track slot.id) {
              <app-card class="slot-card" role="listitem">
                <div class="slot-content">
                  <div class="slot-icon" aria-hidden="true">
                    @if (slot.hasFile) {
                      📄
                    } @else {
                      📭
                    }
                  </div>
                  
                  <div class="slot-info">
                    <h3 class="slot-title">{{ slot.displayName }}</h3>
                    <p class="slot-meta">
                      @if (slot.hasFile && slot.lastUpdatedAt) {
                        <span class="meta-item">
                          <span aria-hidden="true">🕐</span>
                          Updated: {{ formatDate(slot.lastUpdatedAt) }}
                        </span>
                        @if (slot.fileSize) {
                          <span class="meta-item">
                            <span aria-hidden="true">📦</span>
                            {{ formatFileSize(slot.fileSize) }}
                          </span>
                        }
                      } @else {
                        <span class="meta-item empty">
                          <span aria-hidden="true">⏳</span>
                          No file uploaded yet
                        </span>
                      }
                    </p>
                    <p class="slot-url">
                      <span aria-hidden="true">🔗</span>
                      <code>{{ slot.permanentUrl }}</code>
                    </p>
                  </div>
                </div>

                <div class="slot-actions">
                  <app-button
                    variant="primary"
                    (clicked)="onUpdateFile(slot.id)">
                    Update File
                  </app-button>
                  @if (slot.hasFile) {
                    <app-button
                      variant="secondary"
                      (clicked)="onViewSlot(slot.slug)">
                      View
                    </app-button>
                  }
                </div>
              </app-card>
            }
          </div>
        }
      </section>
    </main>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background-color: var(--color-surface);
    }

    .dashboard-header {
      background-color: var(--color-background);
      border-bottom: 1px solid var(--color-border);
      padding: var(--spacing-md);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-content {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
    }

    .dashboard-title {
      font-size: var(--font-size-heading);
      margin: 0;
      color: var(--color-text-primary);
    }

    .dashboard-content {
      max-width: 800px;
      margin: 0 auto;
      padding: var(--spacing-lg);
    }

    .action-bar {
      margin-bottom: var(--spacing-lg);
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl);
      min-height: 400px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl);
      min-height: 400px;
      background-color: var(--color-background);
      border-radius: var(--radius-lg);
      text-align: center;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: var(--spacing-md);
    }

    .empty-title {
      font-size: var(--font-size-heading);
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .empty-description {
      font-size: var(--font-size-body);
      color: var(--color-text-secondary);
      margin: 0 0 var(--spacing-lg) 0;
    }

    .slot-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .slot-card {
      padding: var(--spacing-md);
    }

    .slot-content {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .slot-icon {
      font-size: 2.5rem;
      flex-shrink: 0;
    }

    .slot-info {
      flex: 1;
      min-width: 0;
    }

    .slot-title {
      font-size: var(--font-size-title);
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-xs) 0;
      font-weight: 600;
    }

    .slot-meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-md);
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .meta-item.empty {
      color: var(--color-warning);
    }

    .slot-url {
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .slot-url code {
      background-color: var(--color-surface);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-size: 1em; /* 18px minimum */
      word-break: break-all;
    }

    .slot-actions {
      display: flex;
      gap: var(--spacing-md); /* Increased from var(--spacing-sm) for safer tapping */
      justify-content: flex-end;
    }

    @media (max-width: 640px) {
      .slot-content {
        flex-direction: column;
      }

      .slot-icon {
        text-align: center;
        font-size: 2rem;
      }

      .slot-actions {
        flex-direction: column;
      }

      .slot-actions app-button {
        width: 100%;
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly slotService = inject(SlotService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly slots = signal<Slot[]>([]);
  readonly isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.loadSlots();
  }

  private async loadSlots(): Promise<void> {
    this.isLoading.set(true);
    try {
      const slots = await this.slotService.getSlots();
      this.slots.set(slots);
    } catch (error) {
      console.error('Failed to load slots:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onCreateSlot(): void {
    this.router.navigate(['/admin/slots/create']);
  }

  onUpdateFile(slotId: string): void {
    this.router.navigate(['/admin/upload', slotId]);
  }

  onViewSlot(slug: string): void {
    window.open(`/view/${slug}`, '_blank');
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
