import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlotCategory, SlotStatus, CATEGORY_COLORS } from '@models/slot.model';
import { SlotService } from '@services/slot.service';
import { ClipboardService } from '@services/clipboard.service';
import { SidebarNavigationComponent } from '../layout/sidebar-navigation/sidebar-navigation.component';
import { HeaderBarComponent } from '../layout/header-bar/header-bar.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';

interface HowSlotsWorkItem {
  text: string;
}

interface CategoryGuideItem {
  category: SlotCategory;
  description: string;
}

@Component({
  selector: 'app-new-slot-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SidebarNavigationComponent,
    HeaderBarComponent,
    InputComponent,
    SpinnerComponent,
  ],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar Navigation -->
      <app-sidebar-navigation />

      <!-- Main Content Area -->
      <div class="main-content">
        <!-- Header Bar -->
        <app-header-bar breadcrumb="Dashboard / Create Slot" />

        <!-- Page Content -->
        <main class="page-main">
          <!-- Page Header -->
          <header class="page-header">
            <button
              type="button"
              class="back-button"
              (click)="onCancel()"
              aria-label="Go back to dashboard">
              <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>Back</span>
            </button>
            <div class="page-title-group">
              <h1 class="page-title">Create New Slot</h1>
              <p class="page-subtitle">Set up a permanent link for your church documents</p>
            </div>
          </header>

          <div class="two-column-layout">
            <!-- Left Column - Main Form -->
            <div class="left-column">
              <!-- Card 1: Basic Information -->
              <section class="form-card">
                <header class="card-header">
                  <div class="card-header-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <h2 class="card-title">Basic Information</h2>
                </header>
                <div class="card-divider"></div>
                <div class="card-content">
                  <form [formGroup]="createSlotForm" (ngSubmit)="onSubmit()" novalidate>
                    <!-- Slot Name Field -->
                    <app-input
                      id="slotName"
                      label="Slot Name"
                      type="text"
                      placeholder="e.g., Weekly Liturgy"
                      [required]="true"
                      [control]="slotNameControl"
                      [error]="getSlotNameError()" />

                    <!-- Description Field -->
                    <div class="form-field">
                      <label for="description" class="field-label">
                        Description
                        <span class="required-indicator" aria-hidden="true">(required)</span>
                      </label>
                      <textarea
                        id="description"
                        [formControl]="descriptionControl"
                        [class.textarea--error]="getDescriptionError()"
                        [attr.aria-describedby]="getDescriptionError() ? 'description-error' : 'description-helper'"
                        [attr.aria-invalid]="getDescriptionError() ? 'true' : 'false'"
                        class="app-textarea"
                        placeholder="Brief description of what this slot contains"
                        rows="4"></textarea>
                      @if (getDescriptionError()) {
                        <span id="description-error" class="error-message" role="alert">
                          <span aria-hidden="true">⚠️</span>
                          {{ getDescriptionError() }}
                        </span>
                      } @else {
                        <span id="description-helper" class="helper-text">
                          Help administrators understand the purpose of this slot
                        </span>
                      }
                    </div>

                    <!-- Category and Status Row -->
                    <div class="form-row">
                      <!-- Category Dropdown -->
                      <div class="form-field form-field--category">
                        <label for="category" class="field-label">
                          <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                            <line x1="7" y1="7" x2="7.01" y2="7"/>
                          </svg>
                          Category
                          <span class="required-indicator" aria-hidden="true">(required)</span>
                        </label>
                        <div class="select-wrapper">
                          <select
                            id="category"
                            [formControl]="categoryControl"
                            [class.select--error]="getCategoryError()"
                            [attr.aria-describedby]="getCategoryError() ? 'category-error' : null"
                            [attr.aria-invalid]="getCategoryError() ? 'true' : 'false'"
                            class="app-select">
                            <option value="" disabled>Select a category</option>
                            @for (category of categories; track category) {
                              <option [value]="category">{{ category }}</option>
                            }
                          </select>
                          <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                        @if (getCategoryError()) {
                          <span id="category-error" class="error-message" role="alert">
                            <span aria-hidden="true">⚠️</span>
                            {{ getCategoryError() }}
                          </span>
                        }
                      </div>

                      <!-- Status Dropdown -->
                      <div class="form-field form-field--status">
                        <label for="status" class="field-label">Initial Status</label>
                        <div class="select-wrapper">
                          <select
                            id="status"
                            [formControl]="statusControl"
                            class="app-select">
                            <option [value]="SlotStatus.Active">Active</option>
                            <option [value]="SlotStatus.Draft">Draft</option>
                          </select>
                          <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                        <span class="helper-text">Draft slots are hidden from viewers</span>
                      </div>
                    </div>
                  </form>
                </div>
              </section>

              <!-- Card 2: Permanent URL -->
              <section class="form-card">
                <header class="card-header">
                  <div class="card-header-icon card-header-icon--pink">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </div>
                  <h2 class="card-title">Permanent URL</h2>
                  <button
                    type="button"
                    class="customize-badge"
                    [class.customize-badge--active]="showCustomSlug()"
                    (click)="toggleCustomSlug()"
                    aria-label="Customize URL slug"
                    aria-expanded="{{ showCustomSlug() }}">
                    Customize
                  </button>
                </header>
                <div class="card-divider"></div>
                <div class="card-content">
                  <!-- Custom Slug Input (shown when customize is enabled) -->
                  @if (showCustomSlug()) {
                    <div class="custom-slug-field">
                      <label for="customSlug" class="field-label field-label--small">
                        Custom URL Slug
                        <span class="required-indicator" aria-hidden="true">*</span>
                      </label>
                      <div class="url-input-wrapper">
                        <span class="url-prefix">churchshare.app/view/</span>
                        <input
                          id="customSlug"
                          type="text"
                          [value]="customSlug()"
                          (input)="onCustomSlugChange($any($event.target).value)"
                          class="custom-slug-input"
                          placeholder="your-slug"
                          autocomplete="off" />
                      </div>
                      <p class="url-helper">
                        <em>Use lowercase letters, numbers, and hyphens only</em>
                      </p>
                    </div>
                  }

                  <!-- URL Preview -->
                  <div class="url-preview">
                    <div class="url-display">
                      <span class="url-static">churchshare.app/view/</span>
                      <span class="url-dynamic">{{ generatedSlug() || 'your-slug' }}</span>
                    </div>
                    <button
                      type="button"
                      class="copy-url-button"
                      (click)="copyUrl()"
                      [attr.aria-label]="'Copy URL: churchshare.app/view/' + (generatedSlug() || 'your-slug')"
                      title="Copy URL">
                      @if (copied()) {
                        <svg class="copy-icon copy-icon--success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      } @else {
                        <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      }
                    </button>
                  </div>
                  <p class="url-helper">
                    <em>This link never changes — even when you update the document</em>
                  </p>
                </div>
              </section>
            </div>

            <!-- Right Column - Sidebar -->
            <aside class="right-column">
              <!-- Card 1: How Slots Work -->
              <section class="sidebar-card sidebar-card--highlight">
                <header class="sidebar-card-header sidebar-card-header--amber">
                  <svg class="sidebar-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 18h6a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"/>
                    <path d="M10 2h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
                    <line x1="12" y1="10" x2="12" y2="14"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                  <h3 class="sidebar-card-title sidebar-card-title--amber">How Slots Work</h3>
                </header>
                <ul class="sidebar-card-list">
                  @for (item of howSlotsWorkItems; track item.text; let i = $index) {
                    <li class="sidebar-card-list-item">
                      <span class="bullet-dot bullet-dot--amber"></span>
                      <span>{{ item.text }}</span>
                    </li>
                  }
                </ul>
              </section>

              <!-- Card 2: Category Guide -->
              <section class="sidebar-card">
                <header class="sidebar-card-header">
                  <h3 class="sidebar-card-title">Category Guide</h3>
                </header>
                <ul class="sidebar-card-list">
                  @for (item of categoryGuideItems; track item.category) {
                    <li class="sidebar-card-list-item">
                      <span class="bullet-dot bullet-dot--red"></span>
                      <span class="category-name">{{ item.category }}</span>
                      <span class="category-description">— {{ item.description }}</span>
                    </li>
                  }
                </ul>
              </section>
            </aside>
          </div>

          <!-- Action Buttons -->
          <div class="form-actions">
            <button
              type="button"
              class="btn btn--outlined btn--cancel"
              (click)="onCancel()">
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn--primary btn--create"
              [disabled]="isCreating() || createSlotForm.invalid"
              (click)="onSubmit()">
              @if (isCreating()) {
                <app-spinner [showText]="false" label="Creating..." />
              } @else {
                <span>Create Document Slot</span>
                <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              }
            </button>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      min-height: 100vh;
      background-color: #f0f2f5;
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
    }

    /* Page Header */
    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .back-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background-color: transparent;
      border: none;
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      font-size: var(--font-size-body);
      font-weight: 500;
      cursor: pointer;
      transition: background-color var(--transition-fast), color var(--transition-fast);
      min-height: 48px;
    }

    .back-button:hover {
      background-color: var(--color-surface);
      color: var(--color-text-primary);
    }

    .back-icon {
      width: 20px;
      height: 20px;
    }

    .page-title-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }

    .page-subtitle {
      font-size: 1rem;
      color: var(--color-text-secondary);
      margin: 0;
    }

    /* Two Column Layout */
    .two-column-layout {
      display: grid;
      grid-template-columns: 65% 32%;
      gap: 24px;
      align-items: start;
    }

    .left-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .right-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Form Cards */
    .form-card {
      background-color: var(--color-background);
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
    }

    .card-header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background-color: var(--color-primary-bg);
      border-radius: var(--radius-md);
      color: var(--color-primary);
    }

    .card-header-icon--pink {
      background-color: #fce7f3;
      color: #db2777;
    }

    .card-header-icon svg {
      width: 20px;
      height: 20px;
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .card-divider {
      height: 1px;
      background-color: var(--color-border);
      margin: 0 20px;
    }

    .card-content {
      padding: 20px;
    }

    /* Form Fields */
    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .field-label {
      font-weight: 600;
      color: var(--color-text-primary);
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .field-label--small {
      font-size: 0.8125rem;
    }

    .field-icon {
      width: 16px;
      height: 16px;
      color: var(--color-text-secondary);
    }

    .required-indicator {
      color: var(--color-error);
      font-weight: normal;
      font-size: 0.875rem;
    }

    .app-textarea {
      width: 100%;
      min-height: 96px;
      padding: 12px 16px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-family: inherit;
      color: var(--color-text-primary);
      background-color: var(--color-background);
      resize: vertical;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }

    .app-textarea:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
      outline: none;
    }

    .textarea--error {
      border-color: var(--color-error);
    }

    .textarea--error:focus {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .error-message {
      color: var(--color-error);
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .helper-text {
      color: var(--color-text-secondary);
      font-size: 0.875rem;
    }

    /* Form Row */
    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-field--category {
      flex: 55;
    }

    .form-field--status {
      flex: 42;
    }

    /* Select */
    .select-wrapper {
      position: relative;
    }

    .app-select {
      width: 100%;
      min-height: 48px;
      padding: 12px 40px 12px 16px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-family: inherit;
      color: var(--color-text-primary);
      background-color: var(--color-background);
      appearance: none;
      cursor: pointer;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }

    .app-select:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
      outline: none;
    }

    .select--error {
      border-color: var(--color-error);
    }

    .select--error:focus {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .select-arrow {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      color: var(--color-text-secondary);
      pointer-events: none;
    }

    /* URL Preview */
    .url-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: var(--color-surface);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .url-display {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 1rem;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      overflow: hidden;
    }

    .url-static {
      color: var(--color-text-secondary);
      white-space: nowrap;
    }

    .url-dynamic {
      color: var(--color-primary);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .copy-url-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      background-color: var(--color-background);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background-color var(--transition-fast), border-color var(--transition-fast);
    }

    .copy-url-button:hover {
      background-color: var(--color-surface);
      border-color: var(--color-primary);
    }

    .copy-icon {
      width: 20px;
      height: 20px;
      color: var(--color-text-secondary);
    }

    .copy-icon--success {
      color: var(--color-success);
    }

    .url-helper {
      margin: 12px 0 0 0;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    .url-helper em {
      font-style: italic;
    }

    /* Badge */
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge--pink {
      background-color: #fce7f3;
      color: #db2777;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 16px;
    }

    /* Customize Badge (Button) */
    .customize-badge {
      background-color: #fce7f3;
      color: #db2777;
      border: 1px solid #fbcfe8;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 12px;
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
      margin-left: auto;
    }

    .customize-badge:hover {
      background-color: #fbcfe8;
      border-color: #f472b6;
    }

    .customize-badge--active {
      background-color: #db2777;
      color: white;
      border-color: #db2777;
    }

    .customize-badge--active:hover {
      background-color: #be185d;
      border-color: #be185d;
    }

    /* Custom Slug Field */
    .custom-slug-field {
      margin-bottom: 20px;
      padding: 16px;
      background-color: #f9fafb;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .url-input-wrapper {
      display: flex;
      align-items: stretch;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      transition: border-color var(--transition-fast);
    }

    .url-input-wrapper:focus-within {
      border-color: #14b8a6;
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }

    .url-prefix {
      display: flex;
      align-items: center;
      padding: 0 12px;
      background-color: var(--color-surface);
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      border-right: 1px solid var(--color-border);
      white-space: nowrap;
    }

    .custom-slug-input {
      flex: 1;
      min-width: 0;
      padding: 10px 12px;
      font-size: 0.875rem;
      font-family: inherit;
      color: var(--color-text-primary);
      background-color: var(--color-background);
      border: none;
      outline: none;
    }

    .custom-slug-input::placeholder {
      color: var(--color-text-secondary);
    }

    /* Sidebar Cards */
    .sidebar-card {
      background-color: var(--color-background);
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .sidebar-card--highlight {
      background-color: #fffbea;
      border: 1px solid #fcd34d;
    }

    .sidebar-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
    }

    .sidebar-card-header--amber {
      color: #b45309;
    }

    .sidebar-card-icon {
      width: 22px;
      height: 22px;
    }

    .sidebar-card-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
    }

    .sidebar-card-title--amber {
      color: #b45309;
    }

    .sidebar-card-list {
      list-style: none;
      margin: 0;
      padding: 0 20px 20px;
    }

    .sidebar-card-list-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 0;
      font-size: 0.9375rem;
      color: var(--color-text-primary);
      line-height: 1.5;
    }

    .bullet-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 6px;
    }

    .bullet-dot--amber {
      background-color: #f59e0b;
    }

    .bullet-dot--red {
      background-color: var(--color-primary);
    }

    .category-name {
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .category-description {
      color: var(--color-text-secondary);
    }

    /* Action Buttons */
    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--color-border);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 48px;
      padding: 12px 24px;
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color var(--transition-fast),
                  border-color var(--transition-fast),
                  transform var(--transition-fast);
    }

    .btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .btn--outlined {
      background-color: transparent;
      border: 2px solid var(--color-border);
      color: var(--color-text-primary);
    }

    .btn--outlined:hover:not(:disabled) {
      background-color: var(--color-surface);
      border-color: var(--color-text-secondary);
    }

    .btn--cancel {
      min-width: 120px;
    }

    .btn--primary {
      background-color: var(--color-primary);
      border: 2px solid var(--color-primary);
      color: var(--color-text-on-dark);
    }

    .btn--primary:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
      border-color: var(--color-primary-dark);
    }

    .btn--create {
      min-width: 200px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-arrow {
      width: 18px;
      height: 18px;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .two-column-layout {
        grid-template-columns: 1fr;
      }

      .right-column {
        order: -1;
      }
    }

    @media (max-width: 768px) {
      .main-content {
        margin-left: 72px;
      }

      .page-main {
        padding: 16px;
      }

      .form-row {
        flex-direction: column;
      }

      .form-field--category,
      .form-field--status {
        flex: 1;
      }

      .form-actions {
        flex-direction: column-reverse;
        gap: 12px;
      }

      .btn--cancel,
      .btn--create {
        width: 100%;
      }
    }
  `],
})
export class NewSlotPageComponent {
  private readonly slotService = inject(SlotService);
  private readonly router = inject(Router);
  private readonly clipboardService = inject(ClipboardService);

  readonly isCreating = signal(false);
  readonly copied = signal(false);
  readonly showCustomSlug = signal(false);
  readonly customSlug = signal('');

  readonly categories = Object.values(SlotCategory);
  readonly SlotStatus = SlotStatus;

  readonly howSlotsWorkItems: HowSlotsWorkItem[] = [
    { text: 'Each slot has a permanent URL that never changes' },
    { text: 'Upload a new PDF anytime — the link stays the same' },
    { text: 'Share the link once, use it forever' },
    { text: 'Your congregation always sees the latest version' },
  ];

  readonly categoryGuideItems: CategoryGuideItem[] = [
    { category: SlotCategory.Bulletin, description: 'Weekly service bulletins and liturgy' },
    { category: SlotCategory.Newsletter, description: 'Monthly or weekly church newsletters' },
    { category: SlotCategory.SermonNotes, description: 'Sermon outlines and study guides' },
    { category: SlotCategory.Forms, description: 'Registration forms and applications' },
    { category: SlotCategory.Events, description: 'Event flyers and schedules' },
    { category: SlotCategory.Announcements, description: 'General church announcements' },
  ];

  readonly createSlotForm = new FormGroup({
    slotName: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    description: new FormControl('', [
      Validators.required,
      Validators.minLength(10),
    ]),
    category: new FormControl('', [Validators.required]),
    status: new FormControl(SlotStatus.Active),
  });

  // Separate signal to track slot name changes for slug generation
  readonly slotNameValue = signal('');

  readonly generatedSlug = computed(() => {
    // If custom slug is enabled and has value, use it
    if (this.showCustomSlug() && this.customSlug()) {
      return this.customSlug();
    }
    // Otherwise auto-generate from slot name
    const slotName = this.slotNameValue();
    if (!slotName) return '';
    return this.generateSlug(slotName);
  });

  get slotNameControl() {
    return this.createSlotForm.get('slotName') as FormControl;
  }

  get descriptionControl() {
    return this.createSlotForm.get('description') as FormControl;
  }

  get categoryControl() {
    return this.createSlotForm.get('category') as FormControl;
  }

  get statusControl() {
    return this.createSlotForm.get('status') as FormControl;
  }

  constructor() {
    // Sync slot name value to signal for real-time slug generation
    this.slotNameControl.valueChanges.subscribe((value: string) => {
      this.slotNameValue.set(value || '');
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

  getSlotNameError(): string {
    if (this.slotNameControl.hasError('required') && this.slotNameControl.touched) {
      return 'Please enter a name for this slot';
    }
    if (this.slotNameControl.hasError('minlength') && this.slotNameControl.touched) {
      return 'Name must be at least 3 characters';
    }
    return '';
  }

  getDescriptionError(): string {
    if (this.descriptionControl.hasError('required') && this.descriptionControl.touched) {
      return 'Please enter a description';
    }
    if (this.descriptionControl.hasError('minlength') && this.descriptionControl.touched) {
      return 'Description must be at least 10 characters';
    }
    return '';
  }

  getCategoryError(): string {
    if (this.categoryControl.hasError('required') && this.categoryControl.touched) {
      return 'Please select a category';
    }
    return '';
  }

  toggleCustomSlug(): void {
    this.showCustomSlug.update(show => !show);
    if (this.showCustomSlug()) {
      // Pre-fill with auto-generated slug when enabling custom
      if (!this.customSlug() && this.generatedSlug()) {
        this.customSlug.set(this.generatedSlug());
      }
    }
  }

  onCustomSlugChange(value: string): void {
    this.customSlug.set(this.generateSlug(value));
  }

  async copyUrl(): Promise<void> {
    const slug = this.generatedSlug();
    if (!slug) return;

    const url = `churchshare.app/view/${slug}`;
    const success = await this.clipboardService.copy(url);

    if (success) {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  async onSubmit(): Promise<void> {
    // Mark all fields as touched to trigger validation
    this.slotNameControl.markAsTouched();
    this.descriptionControl.markAsTouched();
    this.categoryControl.markAsTouched();

    // Validate form
    if (this.createSlotForm.invalid) {
      return;
    }

    this.isCreating.set(true);

    try {
      const slug = this.generatedSlug();
      if (!slug) {
        throw new Error('Could not generate URL slug');
      }

      const result = await this.slotService.createSlot({
        displayName: this.slotNameControl.value!,
        slug: slug,
        category: this.categoryControl.value as SlotCategory,
        description: this.descriptionControl.value || undefined,
        status: this.statusControl.value as SlotStatus,
      });

      if (result.error) {
        // Handle error - could show toast or inline error
        console.error('Failed to create slot:', result.error);
      } else {
        // Redirect to upload flow for the newly created slot
        this.router.navigate(['/admin/upload', result.slot.id]);
      }
    } catch (error) {
      console.error('Error creating slot:', error);
    } finally {
      this.isCreating.set(false);
    }
  }
}
