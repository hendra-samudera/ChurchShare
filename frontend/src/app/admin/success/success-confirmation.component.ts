import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Slot } from '@models/slot.model';
import { SlotService } from '@services/slot.service';
import { ClipboardService } from '@services/clipboard.service';
import { WhatsAppShareService } from '@services/whatsapp-share.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { CategoryTagComponent } from '@shared/ui/category-tag/category-tag.component';
import { StatusBadgeComponent } from '@shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-success-confirmation',
  standalone: true,
  imports: [
    RouterLink,
    ButtonComponent,
    SpinnerComponent,
    CategoryTagComponent,
    StatusBadgeComponent,
  ],
  template: `
    <main class="success-container">
      <div class="success-card">
        <!-- Loading State -->
        @if (isLoading()) {
          <section class="loading-section">
            <app-spinner text="Loading details..." />
          </section>
        }

        <!-- Success Content -->
        @else if (slot()) {
          <!-- Success Header -->
          <div class="success-header">
            <div class="success-icon" aria-hidden="true">✓</div>
            <h1 class="success-title">File Updated!</h1>
            <p class="success-subtitle">{{ slot()!.displayName }}</p>
          </div>

          <!-- Document Info Card -->
          <section class="document-info-card">
            <div class="document-header">
              <span class="document-icon" aria-hidden="true">📄</span>
              <div class="document-meta">
                @if (slot()!.originalFilename) {
                  <p class="document-filename">{{ slot()!.originalFilename }}</p>
                }
                @if (slot()!.fileSize) {
                  <p class="document-size">{{ formatFileSize(slot()!.fileSize!) }}</p>
                }
              </div>
            </div>
            <div class="document-tags">
              <app-category-tag [category]="slot()!.category" />
              <app-status-badge [status]="slot()!.status" />
            </div>
          </section>

          <!-- Permanent Link Section -->
          <section class="link-section">
            <label class="link-label">
              <span class="link-label-icon" aria-hidden="true">🔗</span>
              Permanent Link (never changes)
            </label>
            <div class="link-display">
              <code class="link-url" [title]="slot()!.permanentUrl">{{ slot()!.permanentUrl }}</code>
              <app-button
                variant="secondary"
                (clicked)="onCopyLink()"
                [disabled]="copySuccess()">
                @if (copySuccess()) {
                  <span aria-hidden="true">✓</span> Copied!
                } @else {
                  <span aria-hidden="true">📋</span> Copy
                }
              </app-button>
            </div>
          </section>

          <!-- WhatsApp Share Section -->
          <section class="share-section">
            <app-button
              variant="primary"
              [fullWidth]="true"
              (clicked)="onShareWhatsApp()">
              <span aria-hidden="true">📱</span>
              Share via WhatsApp
            </app-button>
            <p class="share-hint">
              Pre-composed message with the permanent link
            </p>
          </section>

          <!-- Return to Dashboard -->
          <section class="return-section">
            <a routerLink="/admin/dashboard" class="return-link">
              ← Back to Dashboard
            </a>
          </section>
        }

        <!-- Error State -->
        @else if (!isLoading() && !slot()) {
          <section class="error-section">
            <div class="error-icon-large" aria-hidden="true">⚠️</div>
            <h2 class="error-title">Slot Not Found</h2>
            <p class="error-message">
              We couldn't find the document slot you're looking for.
            </p>
            <app-button
              variant="primary"
              [fullWidth]="true"
              (clicked)="onReturnToDashboard()">
              Back to Dashboard
            </app-button>
          </section>
        }
      </div>
    </main>
  `,
  styles: [`
    .success-container {
      min-height: 100vh;
      background-color: var(--color-surface);
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-card {
      max-width: 520px;
      width: 100%;
      background-color: var(--color-background);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      padding: 40px 32px;
    }

    /* Loading & Error Sections */
    .loading-section,
    .error-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      gap: 24px;
    }

    /* Success Header */
    .success-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      border-radius: var(--radius-full);
      background-color: var(--color-success);
      color: white;
      font-size: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-weight: 700;
    }

    .success-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 8px 0;
    }

    .success-subtitle {
      font-size: 1.125rem;
      color: var(--color-text-secondary);
      margin: 0;
    }

    /* Document Info Card */
    .document-info-card {
      padding: 20px;
      background-color: var(--color-surface);
      border-radius: var(--radius-lg);
      margin-bottom: 24px;
    }

    .document-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .document-icon {
      font-size: 2.5rem;
      flex-shrink: 0;
    }

    .document-meta {
      min-width: 0;
    }

    .document-filename {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .document-size {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin: 4px 0 0 0;
    }

    .document-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    /* Link Section */
    .link-section {
      margin-bottom: 24px;
    }

    .link-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--color-text-primary);
      font-size: 1rem;
      margin-bottom: 12px;
    }

    .link-label-icon {
      font-size: 1.125rem;
    }

    .link-display {
      display: flex;
      gap: 12px;
      align-items: stretch;
    }

    .link-url {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background-color: var(--color-surface);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      word-break: break-all;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      min-height: 48px;
    }

    /* Share Section */
    .share-section {
      margin-bottom: 24px;
    }

    .share-hint {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      text-align: center;
      margin: 12px 0 0 0;
    }

    /* Return Section */
    .return-section {
      padding-top: 24px;
      border-top: 1px solid var(--color-border);
      text-align: center;
    }

    .return-link {
      font-size: 1rem;
      color: var(--color-text-secondary);
      text-decoration: none;
      font-weight: 500;
      transition: color var(--transition-fast);
    }

    .return-link:hover {
      color: var(--color-text-primary);
      text-decoration: underline;
    }

    /* Error State */
    .error-icon-large {
      font-size: 3rem;
    }

    .error-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .error-message {
      font-size: 1rem;
      color: var(--color-text-secondary);
      margin: 0;
      text-align: center;
      max-width: 320px;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .success-container {
        padding: 16px;
      }

      .success-card {
        padding: 32px 24px;
      }

      .link-display {
        flex-direction: column;
      }

      .link-url {
        width: 100%;
      }
    }
  `],
})
export class SuccessConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly slotService = inject(SlotService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly whatsappService = inject(WhatsAppShareService);

  readonly slotId = signal<string>('');
  readonly slot = signal<Slot | null>(null);
  readonly isLoading = signal(true);
  readonly copySuccess = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('slotId');
    if (id) {
      this.slotId.set(id);
      await this.loadSlotDetails(id);
    }
  }

  private async loadSlotDetails(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const slot = await this.slotService.getSlotById(id);
      this.slot.set(slot || null);
    } catch (error) {
      console.error('Failed to load slot details:', error);
      this.slot.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onCopyLink(): Promise<void> {
    const slot = this.slot();
    if (!slot) return;

    const success = await this.clipboardService.copy(slot.permanentUrl);
    if (success) {
      this.copySuccess.set(true);
      setTimeout(() => {
        this.copySuccess.set(false);
      }, 2000);
    }
  }

  async onShareWhatsApp(): Promise<void> {
    const slot = this.slot();
    if (!slot) return;

    await this.whatsappService.share({
      permanentUrl: slot.permanentUrl,
      documentTitle: slot.displayName,
    });
  }

  onReturnToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
