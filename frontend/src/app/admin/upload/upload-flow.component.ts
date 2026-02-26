import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SlotService } from '@services/slot.service';
import { FileUploadService, UploadEvent, UploadProgress, UploadSuccess } from '@services/file-upload.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { ProgressBarComponent } from '@shared/ui/progress-bar/progress-bar.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';

type UploadStatus = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

@Component({
  selector: 'app-upload-flow',
  standalone: true,
  imports: [ButtonComponent, ProgressBarComponent, SpinnerComponent],
  template: `
    <main class="upload-container">
      <div class="upload-card">
        <!-- Header -->
        <header class="upload-header">
          <app-button
            variant="secondary"
            (clicked)="onBack()">
            ← Back to Dashboard
          </app-button>
          
          @if (slotDisplayName()) {
            <h1 class="upload-title">Update: {{ slotDisplayName() }}</h1>
          } @else {
            <h1 class="upload-title">Upload PDF</h1>
          }
        </header>

        <!-- Idle State - File Selection -->
        @if (uploadStatus() === 'idle') {
          <section class="file-selection-section">
            <div
              class="drop-zone"
              [class.drop-zone--drag-over]="isDragOver()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
              (click)="triggerFileInput()">
              
              <div class="drop-zone-content">
                <div class="drop-icon" aria-hidden="true">📄</div>
                <h2 class="drop-title">Tap to select PDF</h2>
                <p class="drop-description">or drag and drop</p>
                <p class="drop-requirements">
                  <span aria-hidden="true">✓</span> PDF files only<br />
                  <span aria-hidden="true">✓</span> Maximum file size: 5 MB
                </p>
              </div>
            </div>

            <input
              #fileInput
              type="file"
              accept="application/pdf"
              (change)="onFileSelected($event)"
              class="file-input"
              aria-label="Select PDF file" />

            @if (validationError()) {
              <div class="error-message" role="alert">
                <span class="error-icon" aria-hidden="true">⚠️</span>
                <span>{{ validationError() }}</span>
              </div>
            }

            <app-button
              variant="primary"
              [fullWidth]="true"
              (clicked)="triggerFileInput()">
              Select File
            </app-button>
          </section>
        }

        <!-- Validating State -->
        @else if (uploadStatus() === 'validating') {
          <section class="validating-section">
            <app-spinner text="Validating file..." />
          </section>
        }

        <!-- Uploading State -->
        @if (uploadStatus() === 'uploading' && selectedFile()) {
          <section class="uploading-section">
            <div class="file-info">
              <span class="file-icon" aria-hidden="true">📄</span>
              <div class="file-details">
                <p class="file-name">{{ selectedFile()?.name }}</p>
                <p class="file-size">{{ formatFileSize(selectedFile()!.size) }}</p>
              </div>
            </div>

            <app-progress-bar
              [progress]="uploadProgress()"
              [showLabel]="true"
              ariaLabel="Upload progress" />

            <p class="upload-status-text">
              Uploading... Please don't close this window
            </p>

            <app-button
              variant="secondary"
              [fullWidth]="true"
              (clicked)="onCancel()">
              Cancel
            </app-button>
          </section>
        }

        <!-- Success State -->
        @else if (uploadStatus() === 'success') {
          <section class="success-section">
            <div class="success-icon" aria-hidden="true">✓</div>
            <h2 class="success-title">Upload Successful!</h2>
            <p class="success-message">
              Your document has been updated. The permanent link remains the same.
            </p>
          </section>
        }

        <!-- Error State -->
        @else if (uploadStatus() === 'error') {
          <section class="error-section">
            <div class="error-icon-large" aria-hidden="true">✕</div>
            <h2 class="error-title">Upload Failed</h2>
            <p class="error-message">{{ uploadError() }}</p>
            
            <div class="error-actions">
              <app-button
                variant="primary"
                [fullWidth]="true"
                (clicked)="onRetry()">
                Try Again
              </app-button>
              <app-button
                variant="secondary"
                [fullWidth]="true"
                (clicked)="onBack()">
                Back to Dashboard
              </app-button>
            </div>
          </section>
        }
      </div>
    </main>
  `,
  styles: [`
    .upload-container {
      min-height: 100vh;
      background-color: var(--color-surface);
      padding: var(--spacing-md);
    }

    .upload-card {
      max-width: 600px;
      margin: 0 auto;
      background-color: var(--color-background);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      padding: var(--spacing-xl);
    }

    .upload-header {
      margin-bottom: var(--spacing-xl);
    }

    .upload-title {
      font-size: var(--font-size-heading);
      color: var(--color-text-primary);
      margin: var(--spacing-md) 0 0 0;
    }

    .file-selection-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .drop-zone {
      min-height: 280px;
      border: 3px dashed var(--color-border);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: border-color var(--transition-fast),
                  background-color var(--transition-fast);
      padding: var(--spacing-lg);
      text-align: center;
    }

    .drop-zone:hover {
      border-color: var(--color-primary);
      background-color: rgba(26, 115, 232, 0.02);
    }

    .drop-zone--drag-over {
      border-color: var(--color-primary);
      background-color: rgba(26, 115, 232, 0.08);
    }

    .drop-zone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .drop-icon {
      font-size: 4rem;
      margin-bottom: var(--spacing-sm);
    }

    .drop-title {
      font-size: var(--font-size-title);
      color: var(--color-text-primary);
      margin: 0;
      font-weight: 600;
    }

    .drop-description {
      font-size: var(--font-size-body);
      color: var(--color-text-secondary);
      margin: 0;
    }

    .drop-requirements {
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      margin: var(--spacing-md) 0 0 0;
      line-height: 1.8;
    }

    .file-input {
      display: none;
    }

    .validating-section,
    .uploading-section,
    .success-section,
    .error-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl) 0;
      gap: var(--spacing-lg);
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      width: 100%;
      padding: var(--spacing-md);
      background-color: var(--color-surface);
      border-radius: var(--radius-md);
    }

    .file-icon {
      font-size: 2.5rem;
    }

    .file-details {
      flex: 1;
      min-width: 0;
    }

    .file-name {
      font-size: var(--font-size-body);
      color: var(--color-text-primary);
      margin: 0;
      font-weight: 500;
      word-break: break-word;
    }

    .file-size {
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      margin: var(--spacing-xs) 0 0 0;
    }

    .upload-status-text {
      font-size: var(--font-size-body);
      color: var(--color-text-secondary);
      margin: 0;
      text-align: center;
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
    }

    .success-title {
      font-size: var(--font-size-heading);
      color: var(--color-text-primary);
      margin: 0;
    }

    .success-message {
      font-size: var(--font-size-body);
      color: var(--color-text-secondary);
      margin: 0;
      text-align: center;
      max-width: 400px;
    }

    .error-icon-large {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: var(--color-error);
      color: white;
      font-size: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
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

    .error-actions {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      width: 100%;
      max-width: 400px;
    }

    .validation-error,
    .error-message-alert {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background-color: #fef2f2;
      border: 1px solid var(--color-error);
      border-radius: var(--radius-md);
      color: var(--color-error);
      font-size: var(--font-size-body);
    }

    .error-icon {
      font-size: var(--font-size-title);
    }

    @media (max-width: 480px) {
      .upload-card {
        padding: var(--spacing-lg);
      }

      .drop-icon {
        font-size: 3rem;
      }
    }
  `],
})
export class UploadFlowComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly slotService = inject(SlotService);
  private readonly fileUploadService = inject(FileUploadService);

  readonly slotId = signal<string>('');
  readonly slotDisplayName = signal<string>('');
  readonly selectedFile = signal<File | null>(null);
  readonly uploadProgress = signal<number>(0);
  readonly uploadStatus = signal<UploadStatus>('idle');
  readonly validationError = signal<string>('');
  readonly uploadError = signal<string>('');
  readonly isDragOver = signal(false);

  private uploadSubscription: Subscription | null = null;
  private slotIdSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.slotIdSubscription = this.route.params.subscribe((params) => {
      const id = params['slotId'];
      if (id) {
        this.slotId.set(id);
        this.loadSlotInfo(id);
      }
    });
  }

  private async loadSlotInfo(id: string): Promise<void> {
    try {
      const slot = await this.slotService.getSlotById(id);
      if (slot) {
        this.slotDisplayName.set(slot.displayName);
      }
    } catch (error) {
      console.error('Failed to load slot info:', error);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelect(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.handleFileSelect(files[0]);
    }
    // Reset input so same file can be selected again
    input.value = '';
  }

  private handleFileSelect(file: File): void {
    this.validationError.set('');
    this.uploadStatus.set('validating');

    // Validate file
    const validation = this.fileUploadService.validateFile(file);
    
    setTimeout(() => {
      if (!validation.valid) {
        this.validationError.set(validation.error!.message);
        this.uploadStatus.set('idle');
        return;
      }

      // Start upload
      this.selectedFile.set(file);
      this.uploadStatus.set('uploading');
      this.startUpload(file);
    }, 500);
  }

  private startUpload(file: File): void {
    this.uploadSubscription = this.fileUploadService
      .uploadToSlot(this.slotId(), file)
      .subscribe({
        next: (event: UploadEvent) => {
          if (event.type === 'progress') {
            const progressEvent = event as UploadProgress;
            this.uploadProgress.set(progressEvent.percentage);
          } else if (event.type === 'success') {
            this.uploadStatus.set('success');
            setTimeout(() => {
              this.router.navigate(['/admin/success', this.slotId()]);
            }, 1000);
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.uploadError.set('Upload failed. Please check your connection and try again.');
          this.uploadStatus.set('error');
        },
        complete: () => {
          this.uploadSubscription = null;
        },
      });
  }

  onCancel(): void {
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe();
      this.uploadSubscription = null;
    }
    this.uploadStatus.set('idle');
    this.selectedFile.set(null);
    this.uploadProgress.set(0);
  }

  onRetry(): void {
    this.uploadError.set('');
    this.uploadStatus.set('idle');
    this.selectedFile.set(null);
    this.uploadProgress.set(0);
  }

  onBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  ngOnDestroy(): void {
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe();
    }
    if (this.slotIdSubscription) {
      this.slotIdSubscription.unsubscribe();
    }
  }
}
