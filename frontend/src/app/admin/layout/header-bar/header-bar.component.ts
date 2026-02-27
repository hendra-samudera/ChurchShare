import { Component, input } from '@angular/core';

@Component({
  selector: 'app-header-bar',
  standalone: true,
  template: `
    <header class="header-bar" role="banner">
      <div class="header-content">
        <!-- Breadcrumb (Left) -->
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span class="breadcrumb-icon" aria-hidden="true">🏠</span>
          <span class="breadcrumb-text">{{ breadcrumb() }}</span>
        </nav>

        <!-- Actions (Right) -->
        <div class="header-actions">
          <button
            class="header-action-btn"
            aria-label="Notifications"
            [attr.aria-describedby]="hasNotifications() ? 'notification-badge' : null">
            <span aria-hidden="true">🔔</span>
            @if (hasNotifications()) {
              <span id="notification-badge" class="notification-badge"></span>
            }
          </button>
          <button
            class="header-action-btn"
            aria-label="Settings">
            <span aria-hidden="true">⚙️</span>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header-bar {
      position: fixed;
      top: 0;
      left: 280px;
      right: 0;
      height: 64px;
      background-color: var(--color-background);
      border-bottom: 1px solid var(--color-border);
      z-index: 50;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      padding: 0 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      color: var(--color-text-secondary);
    }

    .breadcrumb-icon {
      font-size: 1.125rem;
    }

    .breadcrumb-text {
      font-weight: 500;
      color: var(--color-text-primary);
    }

    /* Header Actions */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-action-btn {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-full);
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: var(--color-text-secondary);
      transition: background-color var(--transition-fast);
      position: relative;
    }

    .header-action-btn:hover {
      background-color: var(--color-surface);
    }

    .header-action-btn:active {
      background-color: var(--color-border-light);
    }

    .notification-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      background-color: var(--color-primary);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-bar {
        left: 72px;
      }

      .header-content {
        padding: 0 16px;
      }

      .breadcrumb-text {
        display: none;
      }
    }
  `],
})
export class HeaderBarComponent {
  breadcrumb = input<string>('Grace Community Church');
  hasNotifications = input<boolean>(false);
}
