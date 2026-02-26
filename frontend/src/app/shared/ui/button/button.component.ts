import { Component, input, output, InputSignal } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      [type]="type()"
      [class]="'app-button app-button--' + variant()"
      [class.app-button--full-width]="fullWidth()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      (click)="clicked.emit($event)">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .app-button {
      min-height: var(--tap-target-min);
      min-width: var(--tap-target-min);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-md);
      font-size: var(--font-size-body);
      font-weight: 600;
      cursor: pointer;
      border: 2px solid transparent;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      transition: background-color var(--transition-fast), 
                  transform var(--transition-fast),
                  border-color var(--transition-fast);
      white-space: nowrap;
    }

    .app-button--primary {
      background-color: var(--color-primary);
      color: white;
    }

    .app-button--primary:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }

    .app-button--secondary {
      background-color: var(--color-surface);
      color: var(--color-text-primary);
      border-color: var(--color-border);
    }

    .app-button--secondary:hover:not(:disabled) {
      background-color: var(--color-border);
    }

    .app-button--danger {
      background-color: var(--color-error);
      color: white;
    }

    .app-button--danger:hover:not(:disabled) {
      background-color: #b92b1f;
    }

    .app-button--full-width {
      width: 100%;
    }

    .app-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .app-button:active:not(:disabled) {
      transform: scale(0.98);
    }
  `],
})
export class ButtonComponent {
  type = input<'button' | 'submit' | 'reset'>('button');
  variant = input<ButtonVariant>('primary');
  fullWidth = input<boolean>(false);
  disabled = input<boolean>(false);
  ariaLabel = input<string>('');
  clicked = output<MouseEvent>();
}
