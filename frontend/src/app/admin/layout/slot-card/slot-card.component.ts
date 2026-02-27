import { Component, input, output, signal } from '@angular/core';
import { Slot, SlotCategory, SlotStatus, CATEGORY_COLORS } from '@models/slot.model';
import { CategoryTagComponent } from '@shared/ui/category-tag/category-tag.component';
import { StatusBadgeComponent } from '@shared/ui/status-badge/status-badge.component';
import { PdfReadyBadgeComponent } from '@shared/ui/pdf-ready-badge/pdf-ready-badge.component';
import { ThreeDotMenuComponent, MenuItem } from '@shared/ui/three-dot-menu/three-dot-menu.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { ProgressBarComponent } from '@shared/ui/progress-bar/progress-bar.component';

@Component({
  selector: 'app-slot-card',
  standalone: true,
  imports: [
    CategoryTagComponent,
    StatusBadgeComponent,
    PdfReadyBadgeComponent,
    ThreeDotMenuComponent,
    ButtonComponent,
    ProgressBarComponent,
  ],
  template: `
    <article
      class="slot-card"
      [class.slot-card--active]="slot().status === 'Active'"
      [class.slot-card--draft]="slot().status === 'Draft'"
      [class.slot-card--archived]="slot().status === 'Archived'"
      [class.slot-card--uploading]="isUploading()">

      <!-- Status Accent Border (top) -->
      <div
        class="status-accent"
        [style.backgroundColor]="getAccentColor()"
        aria-hidden="true"></div>

      <!-- Card Header -->
      <div class="card-header">
        <div class="card-title-section">
          <span class="card-icon" aria-hidden="true">
            @if (slot().hasFile) {
              📄
            } @else {
              📭
            }
          </span>
          <div class="card-title-group">
            <h3 class="card-title">{{ slot().displayName }}</h3>
            @if (slot().description) {
              <p class="card-description">{{ truncateDescription(slot().description!) }}</p>
            }
          </div>
        </div>
        <app-three-dot-menu
          [items]="menuItems()"
          ariaLabel="Slot options"
          (itemClicked)="onMenuItemClick($event)" />
      </div>

      <!-- Tag Row -->
      <div class="tag-row">
        <app-category-tag [category]="slot().category" />
        <app-status-badge [status]="slot().status" />
        @if (slot().hasFile) {
          <app-pdf-ready-badge [ready]="true" />
        }
      </div>

      <!-- File Info Row -->
      @if (slot().hasFile) {
        <div class="file-info">
          <div class="file-details">
            <span class="file-name">{{ slot().originalFilename }}</span>
            <span class="file-meta">
              · {{ formatFileSize(slot().fileSize!) }}
              · Updated {{ formatRelativeDate(slot().lastUpdatedAt!) }}
            </span>
          </div>
          <div class="view-count" aria-label="{{ slot().viewCount }} views">
            <span aria-hidden="true">◎</span>
            {{ slot().viewCount || 0 }}
          </div>
        </div>
      } @else {
        <!-- Empty State Banner -->
        <div class="empty-state-banner">
          <span class="empty-state-icon" aria-hidden="true">⚠️</span>
          <span class="empty-state-text">No file uploaded yet</span>
        </div>
      }

      <!-- Permanent Link Row -->
      <div class="link-row">
        <code class="link-url" [title]="slot().permanentUrl">{{ truncateUrl(slot().permanentUrl) }}</code>
        <button
          class="copy-link-btn"
          (click)="onCopyLink()"
          [attr.aria-label]="'Copy link: ' + slot().permanentUrl"
          title="Copy link">
          <span aria-hidden="true">📋</span>
        </button>
      </div>

      <!-- Action Row -->
      <div class="action-row">
        @if (isUploading()) {
          <!-- Progress Bar replaces action button during upload -->
          <div class="upload-progress">
            <app-progress-bar [progress]="uploadProgress()" [showLabel]="true" />
            <span class="upload-status">Uploading... {{ uploadProgress() }}%</span>
          </div>
        } @else {
          <app-button
            variant="primary"
            (clicked)="onUploadClick()">
            @if (slot().hasFile) {
              <span aria-hidden="true">🔄</span> Replace PDF
            } @else {
              <span aria-hidden="true">📤</span> Upload PDF
            }
          </app-button>
          <button
            class="preview-btn"
            (click)="onPreviewClick()"
            aria-label="Preview in new tab"
            title="Preview">
            <span aria-hidden="true">🔗</span>
          </button>
        }
      </div>
    </article>
  `,
  styles: [`
    .slot-card {
      position: relative;
      background-color: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: var(--shadow-sm);
      transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
      overflow: hidden;
    }

    .slot-card:hover {
      box-shadow: var(--shadow-md);
      border-color: #c7c7c7;
    }

    /* Status Accent Border */
    .status-accent {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }

    .slot-card--active .status-accent {
      background-color: var(--color-success);
    }

    .slot-card--draft .status-accent {
      background-color: var(--color-warning);
    }

    .slot-card--archived .status-accent {
      background-color: var(--color-text-tertiary);
    }

    /* Card Header */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .card-title-section {
      display: flex;
      gap: 12px;
      min-width: 0;
    }

    .card-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .card-title-group {
      min-width: 0;
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 4px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-description {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Tag Row */
    .tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    /* File Info Row */
    .file-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background-color: var(--color-surface);
      border-radius: var(--radius-md);
      margin-bottom: 12px;
    }

    .file-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .file-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-meta {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
    }

    .view-count {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      flex-shrink: 0;
      margin-left: 16px;
    }

    /* Empty State Banner */
    .empty-state-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: var(--color-warning-bg);
      border-radius: var(--radius-md);
      margin-bottom: 12px;
    }

    .empty-state-icon {
      font-size: 1.125rem;
    }

    .empty-state-text {
      font-size: 0.875rem;
      color: var(--color-warning);
      font-weight: 500;
    }

    /* Link Row */
    .link-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background-color: var(--color-surface);
      border-radius: var(--radius-md);
      margin-bottom: 16px;
    }

    .link-url {
      flex: 1;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
    }

    .copy-link-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      color: var(--color-text-secondary);
      transition: background-color var(--transition-fast);
      flex-shrink: 0;
    }

    .copy-link-btn:hover {
      background-color: var(--color-border);
    }

    /* Action Row */
    .action-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .preview-btn {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background-color: var(--color-surface);
      border: 2px solid var(--color-border);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: var(--color-text-secondary);
      transition: background-color var(--transition-fast), border-color var(--transition-fast);
      flex-shrink: 0;
    }

    .preview-btn:hover {
      background-color: var(--color-border-light);
      border-color: #c7c7c7;
    }

    /* Upload Progress */
    .upload-progress {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .upload-status {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      text-align: center;
    }

    /* Uploading State */
    .slot-card--uploading {
      pointer-events: none;
      opacity: 0.8;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .slot-card {
        padding: 16px;
      }

      .card-title {
        font-size: 1rem;
      }

      .file-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .view-count {
        margin-left: 0;
      }

      .action-row {
        flex-direction: column;
      }

      .preview-btn {
        width: 100%;
      }
    }
  `],
})
export class SlotCardComponent {
  slot = input.required<Slot>();
  isUploading = input<boolean>(false);
  uploadProgress = input<number>(0);

  uploadClick = output<string>();
  previewClick = output<string>();
  copyLinkClick = output<string>();
  menuAction = output<{ action: string; slotId: string }>();

  readonly menuItems = signal<MenuItem[]>([
    { id: 'rename', label: 'Rename', icon: '✏️' },
    { id: 'archive', label: 'Archive', icon: '📦' },
    { id: 'copy', label: 'Copy Link', icon: '📋' },
    { id: 'qr', label: 'Download QR Code', icon: '📱', disabled: true },
    { id: 'delete', label: 'Delete', icon: '🗑️', danger: true },
  ]);

  getAccentColor(): string {
    const status = this.slot().status;
    if (status === 'Active') return '#059669';  // var(--color-success)
    if (status === 'Draft') return '#d97706';   // var(--color-warning)
    return '#9ca3af';                            // var(--color-text-tertiary)
  }

  truncateDescription(description: string): string {
    if (description.length <= 50) return description;
    return description.slice(0, 47) + '...';
  }

  truncateUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url.length > 35 ? url.slice(0, 32) + '...' : url;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  onUploadClick(): void {
    this.uploadClick.emit(this.slot().id);
  }

  onPreviewClick(): void {
    this.previewClick.emit(this.slot().slug);
  }

  async onCopyLink(): Promise<void> {
    this.copyLinkClick.emit(this.slot().permanentUrl);
  }

  onMenuItemClick(action: string): void {
    this.menuAction.emit({ action, slotId: this.slot().id });
  }
}
