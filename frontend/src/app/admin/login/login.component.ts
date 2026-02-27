import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@services/auth.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { InputComponent } from '@shared/ui/input/input.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, SpinnerComponent],
  template: `
    <div class="login-split-container">
      <!-- Left Panel (Dark) -->
      <div class="login-left-panel">
        <div class="left-panel-content">
          <!-- Top Brand Header -->
          <div class="brand-header">
            <div class="brand-badge" aria-label="ChurchShare">
              <svg class="badge-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <!-- Church building icon -->
                <path d="M12 2L2 12H5V20H19V12H22L12 2Z" fill="#dc2626"/>
                <path d="M11 7V12H13V7H11Z" fill="#ffffff"/>
                <rect x="10" y="14" width="4" height="6" fill="#ffffff"/>
              </svg>
            </div>
            <div class="brand-header-text">
              <span class="brand-name">ChurchShare</span>
            </div>
          </div>

          <!-- Hero Title (Multi-line) -->
          <div class="hero-section">
            <h1 class="hero-title">
              <span class="hero-line">Document</span>
              <span class="hero-line hero-line-red">Management</span>
              <span class="hero-line">Portal</span>
            </h1>
            <p class="hero-subtitle">
              A modern, secure platform for managing your church documents with permanent links and zero-download viewing.
            </p>
          </div>

          <!-- Feature Highlights -->
          <ul class="feature-list">
            <li class="feature-item">
              <span class="feature-bullet" aria-hidden="true">●</span>
              <span class="feature-text">Zero-download PDF viewing for congregation members</span>
            </li>
            <li class="feature-item">
              <span class="feature-bullet" aria-hidden="true">●</span>
              <span class="feature-text">Permanent links that never change when you update files</span>
            </li>
            <li class="feature-item">
              <span class="feature-bullet" aria-hidden="true">●</span>
              <span class="feature-text">Simple WhatsApp integration for instant sharing</span>
            </li>
          </ul>

          <!-- Footer Copyright -->
          <div class="login-left-footer">
            <p class="copyright-text">© 2026 ChurchShare. All rights reserved.</p>
          </div>
        </div>
      </div>

      <!-- Right Panel (Light) -->
      <div class="login-right-panel">
        <div class="right-panel-content">
          <div class="login-form-container">
            <header class="login-header">
              <h2 class="login-title">Admin Sign In</h2>
              <p class="login-subtitle">Enter your credentials to access the dashboard</p>
            </header>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
              <!-- Email Field -->
              <div class="input-group">
                <div class="input-wrapper">
                  <span class="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="email"
                    [formControl]="emailControl"
                    placeholder="admin@church.org"
                    class="form-input"
                    autocomplete="email" />
                </div>
                @if (emailControl.touched && getEmailError()) {
                  <span class="input-error" role="alert">
                    <svg class="error-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {{ getEmailError() }}
                  </span>
                }
              </div>

              <!-- Password Field -->
              <div class="input-group">
                <div class="input-wrapper">
                  <span class="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    id="password"
                    [formControl]="passwordControl"
                    placeholder="Enter your password"
                    class="form-input"
                    autocomplete="current-password" />
                  <button
                    type="button"
                    class="password-toggle"
                    (click)="togglePassword()">
                    @if (showPassword()) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    }
                    <span class="sr-only">{{ showPassword() ? 'Hide password' : 'Show password' }}</span>
                  </button>
                </div>
                @if (passwordControl.touched && getPasswordError()) {
                  <span class="input-error" role="alert">
                    <svg class="error-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {{ getPasswordError() }}
                  </span>
                }
              </div>

              <!-- Keep Me Logged In Checkbox -->
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [formControl]="keepLoggedInControl"
                  class="checkbox-input" />
                <span class="checkbox-text">Keep me logged in</span>
              </label>

              <!-- Demo Credentials Info Box -->
              <div class="demo-credentials-box" role="note">
                <div class="demo-box-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
                <div class="demo-box-content">
                  <p class="demo-box-title">Demo Credentials</p>
                  <p class="demo-box-text">
                    Email: <code>admin@church.org</code><br/>
                    Password: Any 6+ characters
                  </p>
                </div>
              </div>

              <!-- General Error -->
              @if (generalError()) {
                <div class="general-error" role="alert" aria-live="assertive">
                  <svg class="error-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{{ generalError() }}</span>
                </div>
              }

              <!-- Submit Button -->
              <app-button
                type="submit"
                variant="primary"
                [fullWidth]="true"
                [disabled]="isLoading()">
                @if (isLoading()) {
                  <app-spinner [showText]="false" label="Signing in..." />
                } @else {
                  Sign In to Dashboard <span aria-hidden="true">→</span>
                }
              </app-button>
            </form>

            <footer class="login-footer">
              <p class="login-note">
                <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Restricted access. Authorized personnel only.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Split Container */
    .login-split-container {
      display: flex;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }

    /* Left Panel (Deep Navy with Gradient & Red Glow) */
    .login-left-panel {
      width: 50%;
      height: 100%;
      background: linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%);
      position: relative;
      display: flex;
      align-items: center;
      padding: 48px;
      overflow: hidden;
    }

    /* Red Glow Effect in Upper-Right */
    .login-left-panel::before {
      content: '';
      position: absolute;
      top: -200px;
      right: -200px;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    .left-panel-content {
      max-width: 520px;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      position: relative;
      z-index: 1;
    }

    /* Brand Header (Top-Left) */
    .brand-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 48px;
    }

    .brand-badge {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }

    .badge-icon {
      width: 24px;
      height: 24px;
    }

    .brand-header-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-on-dark);
      letter-spacing: -0.3px;
    }

    /* Hero Section (Center-Left) */
    .hero-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 16px;
    }

    .hero-title {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin: 0;
    }

    .hero-line {
      font-size: 3rem;
      font-weight: 700;
      color: var(--color-text-on-dark);
      line-height: 1.1;
      letter-spacing: -1px;
    }

    .hero-line-red {
      color: #e63946;
    }

    .hero-subtitle {
      font-size: 1.125rem;
      font-weight: 400;
      color: var(--color-text-on-dark-secondary);
      margin: 8px 0 0 0;
      line-height: 1.6;
      max-width: 480px;
    }

    /* Feature List */
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 32px 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .feature-bullet {
      color: var(--color-primary);
      font-size: 0.75rem;
      line-height: 1.5;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .feature-text {
      font-size: 1rem;
      font-weight: 400;
      color: var(--color-text-on-dark-secondary);
      line-height: 1.5;
    }

    /* Footer Copyright (Bottom-Left) */
    .login-left-footer {
      margin-top: auto;
      padding-top: 24px;
    }

    .copyright-text {
      font-size: 0.75rem;
      color: var(--color-text-on-dark-secondary);
      opacity: 0.6;
      margin: 0;
    }

    /* Right Panel (Light) */
    .login-right-panel {
      width: 50%;
      height: 100%;
      background-color: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
    }

    .right-panel-content {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-form-container {
      width: 100%;
      max-width: 440px;
      padding: 24px;
    }

    /* Login Header */
    .login-header {
      text-align: left;
      margin-bottom: 32px;
    }

    .login-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }

    .login-subtitle {
      font-size: 1rem;
      color: var(--color-text-secondary);
      margin: 0;
    }

    /* Form Input Groups */
    .input-group {
      margin-bottom: 20px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 16px;
      width: 20px;
      height: 20px;
      color: var(--color-text-secondary);
      pointer-events: none;
    }

    .input-icon svg {
      width: 100%;
      height: 100%;
    }

    .form-input {
      width: 100%;
      height: 48px;
      padding: 0 48px 0 48px;
      font-size: 1rem;
      font-family: inherit;
      color: var(--color-text-primary);
      background-color: var(--color-background);
      border: 2px solid var(--color-border);
      border-radius: 10px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
      outline: none;
    }

    .form-input::placeholder {
      color: var(--color-text-secondary);
    }

    .password-toggle {
      position: absolute;
      right: 12px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-secondary);
      padding: 0;
    }

    .password-toggle svg {
      width: 20px;
      height: 20px;
      pointer-events: none;
    }

    .input-error {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      font-size: 0.875rem;
      color: var(--color-error);
    }

    .error-icon-svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    /* Checkbox */
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      user-select: none;
      padding: 8px;
      margin: -8px;
    }

    .checkbox-input {
      width: 20px;
      height: 20px;
      min-width: 20px;
      min-height: 20px;
      cursor: pointer;
      accent-color: var(--color-primary);
    }

    .checkbox-text {
      font-size: 1rem;
      color: var(--color-text-primary);
      font-weight: 400;
    }

    /* Demo Credentials Box */
    .demo-credentials-box {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      margin: 24px 0;
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
    }

    .demo-box-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      color: #0284c7;
    }

    .demo-box-icon svg {
      width: 100%;
      height: 100%;
    }

    .demo-box-content {
      flex: 1;
    }

    .demo-box-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0c4a6e;
      margin: 0 0 4px 0;
    }

    .demo-box-text {
      font-size: 0.875rem;
      color: #164e63;
      margin: 0;
      line-height: 1.5;
    }

    .demo-box-text code {
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      background-color: rgba(14, 116, 144, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      color: #0e7490;
    }

    /* General Error */
    .general-error {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: #fef2f2;
      border: 1px solid #d93025;
      border-radius: 10px;
      color: #d93025;
      font-size: 1rem;
      margin-bottom: 20px;
    }

    .error-icon-svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    /* Submit Button */
    form {
      display: flex;
      flex-direction: column;
    }

    app-button {
      margin-top: 8px;
    }

    /* Footer */
    .login-footer {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--color-border);
    }

    .login-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin: 0;
    }

    .footer-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: var(--color-text-secondary);
    }

    /* Responsive - Tablet and Mobile */
    @media (max-width: 1024px) {
      .login-left-panel {
        padding: 32px;
      }

      .hero-line {
        font-size: 2.5rem;
      }

      .brand-name {
        font-size: 1.125rem;
      }
    }

    @media (max-width: 768px) {
      .login-split-container {
        flex-direction: column;
      }

      .login-left-panel {
        width: 100%;
        height: auto;
        min-height: 300px;
        padding: 32px 24px;
      }

      .login-left-panel::before {
        display: none; /* Hide glow effect on mobile for performance */
      }

      .left-panel-content {
        max-width: 100%;
        height: auto;
      }

      .brand-header {
        margin-bottom: 32px;
      }

      .brand-badge {
        width: 36px;
        height: 36px;
      }

      .badge-icon {
        width: 20px;
        height: 20px;
      }

      .brand-name {
        font-size: 1.125rem;
      }

      .hero-section {
        gap: 12px;
      }

      .hero-line {
        font-size: 2rem;
      }

      .hero-subtitle {
        font-size: 1rem;
      }

      .feature-list {
        margin: 24px 0;
        gap: 12px;
      }

      .feature-text {
        font-size: 0.875rem;
      }

      .login-right-panel {
        width: 100%;
        height: auto;
        min-height: calc(100vh - 300px);
        padding: 24px 16px;
      }

      .login-form-container {
        padding: 16px;
      }

      .login-title {
        font-size: 1.5rem;
      }
    }

    @media (max-width: 480px) {
      .login-left-panel {
        min-height: 260px;
        padding: 24px 16px;
      }

      .brand-header {
        margin-bottom: 24px;
      }

      .brand-badge {
        width: 32px;
        height: 32px;
        border-radius: 10px;
      }

      .badge-icon {
        width: 18px;
        height: 18px;
      }

      .hero-line {
        font-size: 1.75rem;
      }

      .hero-subtitle {
        font-size: 0.875rem;
      }

      .feature-item {
        gap: 10px;
      }

      .feature-bullet {
        font-size: 0.625rem;
      }

      .feature-text {
        font-size: 0.8125rem;
      }

      .login-left-footer {
        padding-top: 16px;
      }

      .copyright-text {
        font-size: 0.6875rem;
      }

      .logo-wordmark {
        font-size: 1.5rem;
      }

      .brand-tagline {
        font-size: 0.875rem;
      }

      .login-right-panel {
        min-height: calc(100vh - 160px);
      }

      .login-title {
        font-size: 1.25rem;
      }

      .login-subtitle {
        font-size: 0.875rem;
      }
    }
  `],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly generalError = signal<string | null>(null);
  readonly showPassword = signal(false);

  // Reactive Forms with FormGroup
  readonly loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    keepLoggedIn: new FormControl(true), // PRD: Default ON
  });

  get emailControl() {
    return this.loginForm.get('email') as FormControl;
  }

  get passwordControl() {
    return this.loginForm.get('password') as FormControl;
  }

  get keepLoggedInControl() {
    return this.loginForm.get('keepLoggedIn') as FormControl;
  }

  getEmailError(): string {
    if (this.emailControl.hasError('required')) {
      return 'Please enter your email address';
    }
    if (this.emailControl.hasError('email')) {
      return 'Please enter a valid email address';
    }
    return '';
  }

  getPasswordError(): string {
    if (this.passwordControl.hasError('required')) {
      return 'Please enter your password';
    }
    return '';
  }

  togglePassword(): void {
    this.showPassword.update(show => !show);
  }

  async onSubmit(): Promise<void> {
    // Mark all fields as touched to trigger validation
    this.emailControl.markAsTouched();
    this.passwordControl.markAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.generalError.set(null);

    try {
      const result = await this.authService.login({
        email: this.emailControl.value,
        password: this.passwordControl.value,
        keepLoggedIn: this.keepLoggedInControl.value,
      });

      if (result.success) {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.generalError.set(result.error || 'Login failed. Please try again.');
      }
    } catch {
      this.generalError.set('Something went wrong. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
