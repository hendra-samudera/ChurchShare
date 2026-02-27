import { Component, input, output, signal, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="input-wrapper">
      @if (label()) {
        <label [for]="id()" class="input-label">
          {{ label() }}
          @if (required()) {
            <span class="required-indicator" aria-hidden="true">(required)</span>
          }
        </label>
      }

      <input
        [id]="id()"
        [type]="type()"
        [formControl]="control()"
        [placeholder]="placeholder()"
        [attr.aria-describedby]="error() ? id() + '-error' : null"
        [attr.aria-invalid]="error() ? 'true' : 'false'"
        [class.input--error]="error()"
        class="app-input" />

      @if (error()) {
        <span [id]="id() + '-error'" class="error-message" role="alert">
          {{ error() }}
        </span>
      }

      @if (helperText()) {
        <span [id]="id() + '-helper'" class="helper-text">
          {{ helperText() }}
        </span>
      }
    </div>
  `,
  styles: [`
    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .input-label {
      font-weight: 500;
      color: var(--color-text-primary);
      font-size: var(--font-size-body);
    }

    .required-indicator {
      color: var(--color-error);
      font-weight: normal;
    }

    .app-input {
      min-height: var(--tap-target-min);
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--font-size-body);
      font-family: inherit;
      color: var(--color-text-primary);
      background-color: var(--color-background);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: border-color var(--transition-fast),
                  box-shadow var(--transition-fast);
    }

    .app-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
      outline: none;
    }

    .app-input--error {
      border-color: var(--color-error);
    }

    .app-input--error:focus {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
    }

    .error-message {
      color: var(--color-error);
      font-size: var(--font-size-body);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .helper-text {
      color: var(--color-text-secondary);
      font-size: var(--font-size-body);
    }
  `],
})
export class InputComponent {
  id = input.required<string>();
  label = input<string>('');
  type = input<'text' | 'email' | 'password' | 'number'>('text');
  placeholder = input<string>('');
  required = input<boolean>(false);
  control = input.required<FormControl>();
  error = input<string>('');
  helperText = input<string>('');
}
