import { Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    <div class="spinner-container" [attr.aria-label]="label()">
      <div class="spinner" role="status">
        <span class="sr-only">{{ label() }}</span>
      </div>
      @if (showText()) {
        <p class="spinner-text">{{ text() }}</p>
      }
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--color-surface);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .spinner-text {
      font-size: var(--font-size-body);
      font-weight: 500;
      color: var(--color-text-primary);
      margin: 0;
      text-align: center;
    }

    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation: none;
        border-color: var(--color-primary);
      }
    }
  `],
})
export class SpinnerComponent {
  label = input<string>('Loading');
  showText = input<boolean>(true);
  text = input<string>('Loading...');
}
