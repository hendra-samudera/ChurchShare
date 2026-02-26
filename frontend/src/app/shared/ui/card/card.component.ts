import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="app-card" [class.app-card--clickable]="clickable()" [class.app-card--disabled]="disabled()">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .app-card {
      background-color: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-md);
      box-shadow: var(--shadow-sm);
      transition: box-shadow var(--transition-fast), 
                  transform var(--transition-fast),
                  border-color var(--transition-fast);
    }

    .app-card--clickable {
      cursor: pointer;
    }

    .app-card--clickable:hover:not(.app-card--disabled) {
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary);
      transform: translateY(-2px);
    }

    .app-card--disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `],
})
export class CardComponent {
  clickable = input<boolean>(false);
  disabled = input<boolean>(false);
}
