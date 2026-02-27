import { Component, input } from '@angular/core';

@Component({
  selector: 'app-pdf-ready-badge',
  standalone: true,
  template: `
    @if (ready()) {
      <span class="pdf-ready-badge" aria-label="PDF uploaded and ready">
        <span class="pdf-icon" aria-hidden="true">📄</span>
        PDF Ready
      </span>
    }
  `,
  styles: [`
    .pdf-ready-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 0.875rem; /* 14px - acceptable for badges */
      font-weight: 500;
      background-color: var(--color-success-bg);
      color: var(--color-success);
      white-space: nowrap;
    }

    .pdf-icon {
      font-size: 0.875rem;
    }
  `],
})
export class PdfReadyBadgeComponent {
  ready = input.required<boolean>();
}
