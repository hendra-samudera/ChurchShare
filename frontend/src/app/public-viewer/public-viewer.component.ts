import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Slot } from '@services/mock-data.service';
import { PdfRenderService } from '@services/pdf-render.service';
import { SlotFetchService } from '@services/slot-fetch.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { DecimalPipe } from '@angular/common';

type ViewerState = 'loading' | 'display' | 'empty' | 'error';

@Component({
  selector: 'app-public-viewer',
  standalone: true,
  imports: [ButtonComponent, SpinnerComponent, DecimalPipe],
  template: `
    <main class="viewer-container" #viewerContainer>
      <!-- ==================== LOADING STATE ==================== -->
      @if (currentState() === 'loading') {
        <section class="state-container loading-state" role="status" aria-live="polite">
          <app-spinner text="Loading your document..." />
          <p class="loading-subtitle">Please wait, this may take a moment on slower connections</p>
        </section>
      }

      <!-- ==================== EMPTY STATE ==================== -->
      @else if (currentState() === 'empty') {
        <section class="state-container empty-state" role="status" aria-live="polite">
          <div class="state-icon" aria-hidden="true">📭</div>
          <h1 class="state-title">Nothing uploaded here yet.</h1>
          <p class="state-subtitle">Check back soon!</p>
          <p class="state-description">The document will appear here when it's ready.</p>
        </section>
      }

      <!-- ==================== ERROR STATE ==================== -->
      @else if (currentState() === 'error') {
        <section class="state-container error-state" role="alert" aria-live="assertive">
          <div class="state-icon" aria-hidden="true">⚠️</div>
          <h1 class="state-title">{{ errorMessage() }}</h1>
          <p class="state-subtitle">Please check the link you received or try again.</p>
          <app-button
            variant="primary"
            (clicked)="retry()">
            <span aria-hidden="true">🔄</span> Try Again
          </app-button>
        </section>
      }

      <!-- ==================== DISPLAY STATE ==================== -->
      @else if (currentState() === 'display') {
        <!-- Header -->
        <header class="document-header">
          <h1 class="document-title">{{ documentTitle() }}</h1>
          @if (documentSubtitle()) {
            <p class="document-subtitle">{{ documentSubtitle() }}</p>
          }
        </header>

        <!-- Zoom Controls -->
        <div class="zoom-controls" role="group" aria-label="Zoom controls">
          <app-button
            variant="secondary"
            (clicked)="zoomOut()"
            [disabled]="zoomLevel() <= 0.5">
            <span aria-hidden="true">−</span> Out
          </app-button>
          <span class="zoom-level" aria-live="polite">{{ (zoomLevel() * 100) | number:'1.0-0' }}%</span>
          <app-button
            variant="secondary"
            (clicked)="zoomIn()"
            [disabled]="zoomLevel() >= 3.0">
            <span aria-hidden="true">+</span> In
          </app-button>
          <app-button
            variant="secondary"
            (clicked)="resetZoom()">
            <span aria-hidden="true">⟲</span> Reset
          </app-button>
        </div>

        <!-- PDF Canvas Container -->
        <div class="pdf-container" #pdfContainer>
          @for (page of getPagesArray(); track page) {
            <canvas
              #canvas
              [attr.data-page]="page"
              [attr.aria-label]="'Page ' + page + ' of ' + totalPages()"
              role="img"
              class="pdf-canvas">
            </canvas>
          }
        </div>

        <!-- Optional Save Button -->
        <div class="save-section">
          <app-button
            variant="secondary"
            [fullWidth]="true"
            (clicked)="saveToPhone()">
            <span aria-hidden="true">💾</span> Save to Phone
          </app-button>
          <p class="save-note">
            <span aria-hidden="true">ℹ️</span>
            This will download the PDF to your device
          </p>
        </div>
      }
    </main>
  `,
  styles: [`
    .viewer-container {
      min-height: 100vh;
      background-color: var(--color-surface);
    }

    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: var(--spacing-lg);
      text-align: center;
    }

    .loading-state {
      gap: var(--spacing-md);
    }

    .loading-subtitle {
      font-size: var(--font-size-body);
      color: var(--color-text-secondary);
      margin: 0;
    }

    .empty-state,
    .error-state {
      gap: var(--spacing-md);
    }

    .state-icon {
      font-size: 5rem;
      margin-bottom: var(--spacing-md);
    }

    .state-title {
      font-size: var(--font-size-heading);
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .state-subtitle {
      font-size: var(--font-size-body);
      color: var(--color-text-secondary);
      margin: 0 0 var(--spacing-md) 0;
    }

    .state-description {
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      margin: 0;
    }

    .document-header {
      background-color: var(--color-background);
      border-bottom: 1px solid var(--color-border);
      padding: var(--spacing-md);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .document-title {
      font-size: var(--font-size-title);
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-xs) 0;
      font-weight: 700;
    }

    .document-subtitle {
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      margin: 0;
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background-color: var(--color-background);
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 60px;
      z-index: 9;
    }

    .zoom-level {
      min-width: 60px;
      text-align: center;
      font-size: var(--font-size-body);
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .pdf-container {
      padding: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      align-items: center;
    }

    .pdf-canvas {
      max-width: 100%;
      box-shadow: var(--shadow-md);
      border-radius: var(--radius-sm);
      background-color: white;
    }

    .save-section {
      padding: var(--spacing-lg);
      background-color: var(--color-background);
      border-top: 1px solid var(--color-border);
    }

    .save-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      margin: var(--spacing-sm) 0 0 0;
    }

    @media (max-width: 480px) {
      .document-header {
        padding: var(--spacing-sm);
      }

      .document-title {
        font-size: var(--font-size-title); /* Maintain 20px minimum */
        font-weight: 700; /* Ensure visual dominance */
      }

      .zoom-controls {
        flex-wrap: wrap;
        gap: var(--spacing-md); /* Increased spacing */
        top: 60px;
      }

      .zoom-controls app-button {
        /* Ensure minimum touch target */
        min-width: 48px;
        min-height: 48px;
      }
    }
  `],
})
export class PublicViewerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly pdfService = inject(PdfRenderService);
  private readonly slotService = inject(SlotFetchService);

  readonly currentState = signal<ViewerState>('loading');
  readonly documentTitle = signal<string>('');
  readonly documentSubtitle = signal<string>('');
  readonly errorMessage = signal<string>('');
  readonly totalPages = signal<number>(0);
  readonly zoomLevel = signal<number>(1.0);

  @ViewChild('pdfContainer') pdfContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('pdfContainer', { read: ElementRef }) canvasElements!: ElementRef<HTMLCanvasElement>;

  private routeSubscription: Subscription | null = null;
  private currentSlug = signal<string>('');

  /**
   * Get array of page numbers for @for loop
   */
  getPagesArray(): number[] {
    const total = this.totalPages();
    return total > 0 ? Array.from({ length: total }, (_, i) => i + 1) : [];
  }

  ngOnInit(): void {
    this.routeSubscription = this.route.params.subscribe((params) => {
      const slug = params['slug'];
      if (!slug) {
        this.showError('This link is incomplete. Please check the URL you received.');
        return;
      }
      this.currentSlug.set(slug);
      this.loadSlot(slug);
    });
  }

  private async loadSlot(slug: string): Promise<void> {
    this.currentState.set('loading');
    this.errorMessage.set('');

    try {
      const slot = await this.slotService.fetchSlot(slug);

      if (!slot) {
        this.showError('This document link does not exist. Please check the link you received.');
        return;
      }

      if (!slot.hasFile) {
        this.currentState.set('empty');
        return;
      }

      this.documentTitle.set(slot.displayName || 'Document');
      this.documentSubtitle.set(slot.lastUpdatedAt ? this.formatDate(slot.lastUpdatedAt) : '');

      // Get PDF URL
      const pdfUrl = this.slotService.getPdfUrl(slot);
      
      if (!pdfUrl) {
        this.currentState.set('empty');
        return;
      }

      // Load PDF document
      await this.pdfService.loadDocument(pdfUrl);
      this.totalPages.set(this.pdfService.getTotalPages());
      this.currentState.set('display');

      // Render pages after view is initialized
      setTimeout(() => {
        this.renderAllPages();
      }, 100);

    } catch (error) {
      console.error('Failed to load slot:', error);
      this.showError('Unable to load document. Please check your connection and tap retry.');
    }
  }

  private async renderAllPages(): Promise<void> {
    const canvases = document.querySelectorAll('.pdf-canvas');
    
    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i] as HTMLCanvasElement;
      const pageNumber = i + 1;
      
      try {
        await this.pdfService.renderPage(pageNumber, canvas, this.zoomLevel());
      } catch (error) {
        console.error(`Failed to render page ${pageNumber}:`, error);
      }
    }
  }

  retry(): void {
    this.loadSlot(this.currentSlug());
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    this.currentState.set('error');
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  zoomIn(): void {
    this.zoomLevel.update((z) => Math.min(z + 0.25, 3.0));
    setTimeout(() => this.renderAllPages(), 50);
  }

  zoomOut(): void {
    this.zoomLevel.update((z) => Math.max(z - 0.25, 0.5));
    setTimeout(() => this.renderAllPages(), 50);
  }

  resetZoom(): void {
    this.zoomLevel.set(1.0);
    setTimeout(() => this.renderAllPages(), 50);
  }

  async saveToPhone(): Promise<void> {
    // Get PDF URL and trigger download
    const slot = await this.slotService.fetchSlot(this.currentSlug());
    const pdfUrl = slot ? this.slotService.getPdfUrl(slot) : null;
    
    if (!pdfUrl) return;

    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${this.documentTitle()}.pdf`;
      link.click();

      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  }

  ngOnDestroy(): void {
    this.pdfService.cleanup();
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
}
