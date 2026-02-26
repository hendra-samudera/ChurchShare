import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlotService } from '@services/slot.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';

@Component({
  selector: 'app-create-slot',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, SpinnerComponent],
  template: `
    <main class="create-slot-container">
      <div class="create-slot-card">
        <!-- Header -->
        <header class="create-slot-header">
          <app-button
            variant="secondary"
            (clicked)="onBack()">
            ← Back to Dashboard
          </app-button>
          <h1 class="page-title">Create New Document Slot</h1>
          <p class="page-description">
            Create a permanent link for your church documents. The URL never changes, even when you update the file.
          </p>
        </header>

        <form [formGroup]="createSlotForm" (ngSubmit)="onSubmit()" novalidate>
          <!-- Display Name Field -->
          <app-input
            id="displayName"
            label="Display Name"
            type="text"
            placeholder="e.g., Weekly Liturgy"
            [required]="true"
            [control]="displayNameControl"
            [error]="getDisplayNameError()"
            helperText="What you'll see in your dashboard" />

          <!-- URL Slug Field -->
          <div class="slug-field">
            <label for="slug" class="slug-label">
              URL Slug
              <span class="required-indicator" aria-hidden="true">(required)</span>
            </label>
            <p class="slug-description">
              The permanent link - cannot be changed later
            </p>
            
            <div class="slug-input-group">
              <span class="slug-prefix">churchshare.app/view/</span>
              <input
                id="slug"
                type="text"
                [formControl]="slugControl"
                [class.input--error]="getSlugError() || slugTaken()"
                [attr.aria-describedby]="getSlugError() || slugTaken() ? 'slug-error' : 'slug-helper'"
                [attr.aria-invalid]="getSlugError() || slugTaken() ? 'true' : 'false'"
                class="app-input slug-input"
                placeholder="weekly-liturgy" />
            </div>

            @if (slugTaken()) {
              <span id="slug-error" class="error-message" role="alert">
                <span aria-hidden="true">⚠️</span>
                This URL is already taken. Please choose another.
              </span>
            } @else if (getSlugError()) {
              <span id="slug-error" class="error-message" role="alert">
                <span aria-hidden="true">⚠️</span>
                {{ getSlugError() }}
              </span>
            } @else {
              <span id="slug-helper" class="helper-text">
                Use only lowercase letters, numbers, and hyphens
              </span>
            }
          </div>

          <!-- General Error -->
          @if (formError()) {
            <div class="general-error" role="alert">
              <span class="error-icon" aria-hidden="true">⚠️</span>
              <span>{{ formError() }}</span>
            </div>
          }

          <!-- Submit Button -->
          <div class="form-actions">
            <app-button
              type="submit"
              variant="primary"
              [fullWidth]="true"
              [disabled]="isCreating() || slugTaken()">
              @if (isCreating()) {
                <app-spinner [showText]="false" label="Creating..." />
              } @else {
                Create Slot
              }
            </app-button>
          </div>
        </form>
      </div>
    </main>
  `,
  styles: [`
    .create-slot-container {
      min-height: 100vh;
      background-color: var(--color-surface);
      padding: var(--spacing-md);
    }

    .create-slot-card {
      max-width: 600px;
      margin: 0 auto;
      background-color: var(--color-background);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      padding: var(--spacing-xl);
    }

    .create-slot-header {
      margin-bottom: var(--spacing-xl);
    }

    .page-title {
      font-size: var(--font-size-heading);
      color: var(--color-text-primary);
      margin: var(--spacing-md) 0 var(--spacing-xs) 0;
    }

    .page-description {
      font-size: var(--font-size-body);
      color: var(--color-text-secondary);
      margin: 0;
      line-height: 1.6;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .slug-field {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .slug-label {
      font-weight: 500;
      color: var(--color-text-primary);
      font-size: var(--font-size-body);
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .required-indicator {
      color: var(--color-error);
      font-weight: normal;
    }

    .slug-description {
      font-size: var(--font-size-body);
      color: var(--color-text-secondary);
      margin: 0;
    }

    .slug-input-group {
      display: flex;
      align-items: stretch;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      transition: border-color var(--transition-fast);
    }

    .slug-input-group:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.2);
    }

    .slug-input-group.input--error {
      border-color: var(--color-error);
    }

    .slug-input-group.input--error:focus-within {
      box-shadow: 0 0 0 3px rgba(217, 48, 37, 0.2);
    }

    .slug-prefix {
      display: flex;
      align-items: center;
      padding: 0 var(--spacing-md);
      background-color: var(--color-surface);
      color: var(--color-text-secondary);
      font-size: var(--font-size-body);
      border-right: 1px solid var(--color-border);
      white-space: nowrap;
    }

    .slug-input {
      flex: 1;
      min-width: 0;
      border: none;
      border-radius: 0;
      min-height: var(--tap-target-min);
    }

    .slug-input:focus {
      box-shadow: none;
      outline: none;
    }

    .form-actions {
      margin-top: var(--spacing-md);
    }

    .general-error {
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
      .create-slot-card {
        padding: var(--spacing-lg);
      }

      .slug-prefix {
        font-size: var(--font-size-body);
        padding: 0 var(--spacing-sm);
      }
    }
  `],
})
export class CreateSlotComponent {
  private readonly slotService = inject(SlotService);
  private readonly router = inject(Router);

  readonly isCreating = signal(false);
  readonly formError = signal<string | null>(null);
  readonly slugTaken = signal(false);

  readonly createSlotForm = new FormGroup({
    displayName: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    slug: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    ]),
  });

  get displayNameControl() {
    return this.createSlotForm.get('displayName') as FormControl;
  }

  get slugControl() {
    return this.createSlotForm.get('slug') as FormControl;
  }

  constructor() {
    // Auto-generate slug from display name as user types
    this.displayNameControl.valueChanges.subscribe((value: string) => {
      if (value && !this.slugControl.dirty) {
        const generatedSlug = this.generateSlug(value);
        this.slugControl.setValue(generatedSlug, { emitEvent: false });
        this.checkSlugAvailability(generatedSlug);
      }
    });

    // Check slug availability when slug changes
    this.slugControl.valueChanges.subscribe((value: string) => {
      if (value) {
        this.checkSlugAvailability(value);
      }
    });
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async checkSlugAvailability(slug: string): Promise<void> {
    if (!slug || slug.length < 3) {
      this.slugTaken.set(false);
      return;
    }

    try {
      const exists = await this.slotService.checkSlugExists(slug);
      this.slugTaken.set(exists);
    } catch {
      this.slugTaken.set(false);
    }
  }

  getDisplayNameError(): string {
    if (this.displayNameControl.hasError('required')) {
      return 'Please enter a name for this slot';
    }
    if (this.displayNameControl.hasError('minlength')) {
      return 'Name must be at least 3 characters';
    }
    return '';
  }

  getSlugError(): string {
    if (this.slugControl.hasError('required')) {
      return 'Please enter a URL slug';
    }
    if (this.slugControl.hasError('pattern')) {
      return 'Use only lowercase letters, numbers, and hyphens';
    }
    return '';
  }

  async onSubmit(): Promise<void> {
    // Mark all fields as touched
    this.displayNameControl.markAsTouched();
    this.slugControl.markAsTouched();

    // Validate form
    if (this.createSlotForm.invalid || this.slugTaken()) {
      return;
    }

    this.isCreating.set(true);
    this.formError.set(null);

    try {
      const result = await this.slotService.createSlot({
        displayName: this.displayNameControl.value,
        slug: this.slugControl.value,
      });

      if (result.error) {
        this.formError.set(result.error);
      } else {
        // Redirect to upload flow
        this.router.navigate(['/admin/upload', result.slot.id]);
      }
    } catch {
      this.formError.set('Could not create slot. Please try again.');
    } finally {
      this.isCreating.set(false);
    }
  }

  onBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
