import { Component, input } from '@angular/core';
import { SlotStatus, STATUS_COLORS } from '@models/slot.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span
      class="status-badge"
      [class.status-badge--active]="status() === 'Active'"
      [class.status-badge--draft]="status() === 'Draft'"
      [class.status-badge--archived]="status() === 'Archived'"
      [attr.aria-label]="'Status: ' + status()">
      @if (status() === 'Active') {
        <span class="status-dot" aria-hidden="true"></span>
      } @else if (status() === 'Draft') {
        <span class="status-icon" aria-hidden="true">🕐</span>
      }
      {{ status() }}
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 0.875rem; /* 14px - acceptable for badges */
      font-weight: 500;
      background-color: var(--color-border-light);
      color: var(--color-text-secondary);
      white-space: nowrap;
    }

    .status-badge--active {
      background-color: var(--color-success-bg);
      color: var(--color-success);
    }

    .status-badge--draft {
      background-color: var(--color-warning-bg);
      color: var(--color-warning);
    }

    .status-badge--archived {
      background-color: var(--color-border-light);
      color: var(--color-text-secondary);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      background-color: var(--color-success);
    }

    .status-icon {
      font-size: 0.75rem;
    }
  `],
})
export class StatusBadgeComponent {
  status = input.required<SlotStatus>();
}
