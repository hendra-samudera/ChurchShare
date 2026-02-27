import { Component, input } from '@angular/core';
import { DashboardStats } from '@models/slot.model';

@Component({
  selector: 'app-summary-stats-row',
  standalone: true,
  template: `
    <section class="stats-row" aria-label="Dashboard statistics">
      <div class="stat-card">
        <div class="stat-icon stat-icon--primary" aria-hidden="true">📄</div>
        <div class="stat-content">
          <span class="stat-value">{{ stats().totalSlots }}</span>
          <span class="stat-label">Total Slots</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--success" aria-hidden="true">✓</div>
        <div class="stat-content">
          <span class="stat-value">{{ stats().activeSlots }}</span>
          <span class="stat-label">Active Slots</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--secondary" aria-hidden="true">📤</div>
        <div class="stat-content">
          <span class="stat-value">{{ stats().slotsWithFiles }}</span>
          <span class="stat-label">With Files</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--info" aria-hidden="true">📈</div>
        <div class="stat-content">
          <span class="stat-value">{{ stats().totalViews }}</span>
          <span class="stat-label">Total Views</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background-color: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .stat-icon--primary {
      background-color: var(--color-primary-bg);
      color: var(--color-primary);
    }

    .stat-icon--success {
      background-color: var(--color-success-bg);
      color: var(--color-success);
    }

    .stat-icon--secondary {
      background-color: var(--color-secondary-bg);
      color: var(--color-secondary);
    }

    .stat-icon--info {
      background-color: var(--color-info-bg);
      color: var(--color-info);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin-top: 4px;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .stats-row {
        grid-template-columns: 1fr;
      }

      .stat-card {
        padding: 16px;
      }

      .stat-icon {
        width: 44px;
        height: 44px;
      }

      .stat-value {
        font-size: 1.75rem;
      }
    }
  `],
})
export class SummaryStatsRowComponent {
  stats = input.required<DashboardStats>();
}
