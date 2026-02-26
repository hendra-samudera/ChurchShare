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
    <main class="login-container">
      <div class="login-card">
        <header class="login-header">
          <h1 class="login-title">ChurchShare</h1>
          <p class="login-subtitle">Admin Login</p>
        </header>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
          <!-- Email Field -->
          <app-input
            id="email"
            label="Email Address"
            type="email"
            placeholder="pastor@church.org"
            [required]="true"
            [control]="emailControl"
            [error]="getEmailError()"
            helperText="We'll never share your email with anyone else." />

          <!-- Password Field -->
          <app-input
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            [required]="true"
            [control]="passwordControl"
            [error]="getPasswordError()" />

          <!-- Keep Me Logged In Checkbox -->
          <label class="checkbox-label">
            <input
              type="checkbox"
              [formControl]="keepLoggedInControl"
              class="checkbox-input" />
            <span class="checkbox-text">Keep me logged in</span>
          </label>

          <!-- General Error -->
          @if (generalError()) {
            <div class="general-error" role="alert" aria-live="assertive">
              <span class="error-icon" aria-hidden="true">⚠️</span>
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
              Sign In
            }
          </app-button>
        </form>

        <footer class="login-footer">
          <p class="login-note">
            <span aria-hidden="true">ℹ️</span>
            This is a demo. Use any valid email format and password.
          </p>
        </footer>
      </div>
    </main>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: var(--spacing-md);
      background-color: var(--color-surface);
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background-color: var(--color-background);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      padding: var(--spacing-xl);
    }

    .login-header {
      text-align: center;
      margin-bottom: var(--spacing-xl);
    }

    .login-title {
      font-size: var(--font-size-heading);
      color: var(--color-primary);
      margin: 0 0 var(--spacing-xs) 0;
    }

    .login-subtitle {
      font-size: var(--font-size-body);
      color: var(--color-text-secondary);
      margin: 0;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      min-height: var(--tap-target-min);
      cursor: pointer;
      user-select: none;
      padding: var(--spacing-xs);
      margin: calc(var(--spacing-xs) * -1);
    }

    .checkbox-input {
      min-width: 48px;
      min-height: 48px;
      cursor: pointer;
    }

    .checkbox-text {
      font-size: var(--font-size-body);
      color: var(--color-text-primary);
      font-weight: 400;
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

    .login-footer {
      margin-top: var(--spacing-lg);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
    }

    .login-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-body);
      color: var(--color-text-secondary);
      margin: 0;
    }

    @media (max-width: 480px) {
      .login-card {
        padding: var(--spacing-lg);
      }
    }
  `],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly generalError = signal<string | null>(null);

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
