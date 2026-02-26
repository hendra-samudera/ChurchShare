import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Slot } from '@services/mock-data.service';
import { SlotService } from '@services/slot.service';
import { ClipboardService } from '@services/clipboard.service';
import { WhatsAppShareService } from '@services/whatsapp-share.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';

@Component({
  selector: 'app-success-confirmation',
  standalone: true,
  imports: [ButtonComponent, SpinnerComponent],
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
          <!-- Success Icon -->
          <div class="success-header">
            <div class="success-icon" aria-hidden="true">✓</div>
            <h1 class="success-title">Upload Successful!</h1>
          </div>

          <!-- Document Info -->
          <section class="document-info">
            <h2 class="document-title">{{ slot()!.displayName }}</h2>
            @if (slot()!.lastUpdatedAt) {
              <p class="document-updated">
                Updated: {{ formatDate(slot()!.lastUpdatedAt!) }}
              </p>
            }
          </section>

          <!-- PDF Preview Placeholder -->
          <section class="preview-section">
            <div class="preview-placeholder">
              <div class="preview-icon" aria-hidden="true">📄</div>
              <p class="preview-text">PDF Preview</p>
              @if (slot()!.originalFilename) {
                <p class="preview-filename">{{ slot()!.originalFilename }}</p>
              }
              @if (slot()!.fileSize) {
                <p class="preview-size">{{ formatFileSize(slot()!.fileSize!) }}</p>
              }
            </div>
          </section>

          <!-- Permanent Link -->
          <section class="link-section">
            <label class="link-label">Permanent Link (never changes):</label>
            <div class="link-display">
              <code class="link-url">{{ slot()!.permanentUrl }}</code>
              <app-button
                variant="secondary"
                (clicked)="onCopyLink()"
                [disabled]="copySuccess()">
                @if (copySuccess()) {
                  <span aria-hidden="true">✓</span> Copied!
                } @else {
                  <span aria-hidden="true">📋</span> Copy Link
                }
              </app-button>
            </div>
          </section>

          <!-- WhatsApp Share -->
          <section class="share-section">
            <app-button
              variant="primary"
              [fullWidth]="true"
              (clicked)="onShareWhatsApp()">
              <span aria-hidden="true">📱</span>
              Share via WhatsApp
            </app-button>
          </section>

          <!-- Return to Dashboard -->
          <section class="return-section">
            <app-button
              variant="secondary"
              [fullWidth]="true"
              (clicked)="onReturnToDashboard()">
              Return to Dashboard
            </app-button>
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
      padding: var(--spacing-md);
    }

    .success-card {
      max-width: 600px;
      margin: 0 auto;
      background-color: var(--color-background);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      padding: var(--spacing-xl);
    }

    .loading-section,
    .error-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl) 0;
      gap: var(--spacing-lg);
    }

    .success-header {
      text-align: center;
      margin-bottom: var(--spacing-lg);
    }

    .success-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: var(--color-success);
      color: white;
      font-size: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--spacing-md);
    }

    .success-title {
      font-size: var(--font-size-heading);
      color: var(--color-text-primary);
      margin: 0;
    }

    .document-info {
      text-align: center;
      margin-bottom: var(--spacing-lg);
    }

    .document-title {
      font-size: var(--font-size-title);
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-xs) 0;
      font-weight: 600;
    }

    .document-updated {
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      margin: 0;
    }

    .preview-section {
      margin-bottom: var(--spacing-lg);
    }

    .preview-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl);
      background-color: var(--color-surface);
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-md);
      text-align: center;
    }

    .preview-icon {
      font-size: 4rem;
      margin-bottom: var(--spacing-sm);
    }

    .preview-text {
      font-size: var(--font-size-body);
      color: var(--color-text-secondary);
      font-weight: 500;
      margin: 0 0 var(--spacing-xs) 0;
    }

    .preview-filename {
      font-size: var(--font-size-small);
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-xs) 0;
      word-break: break-word;
    }

    .preview-size {
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      margin: 0;
    }

    .link-section {
      margin-bottom: var(--spacing-lg);
    }

    .link-label {
      display: block;
      font-weight: 500;
      color: var(--color-text-primary);
      font-size: var(--font-size-body);
      margin-bottom: var(--spacing-sm);
    }

    .link-display {
      display: flex;
      gap: var(--spacing-sm);
      align-items: stretch;
    }

    .link-url {
      flex: 1;
      display: flex;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--font-size-small);
      word-break: break-all;
      min-height: var(--tap-target-min);
    }

    .share-section {
      margin-bottom: var(--spacing-md);
    }

    .return-section {
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
    }

    .error-icon-large {
      font-size: 4rem;
    }

    .error-title {
      font-size: var(--font-size-heading);
      color: var(--color-text-primary);
      margin: 0;
    }

    .error-message {
      font-size: var(--font-size-body);
      color: var(--color-text-secondary);
      margin: 0;
      text-align: center;
      max-width: 400px;
    }

    @media (max-width: 480px) {
      .success-card {
        padding: var(--spacing-lg);
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
