import { Component, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MockDataService } from '@services/mock-data.service';
import { AuthService } from '@services/auth.service';
import { User } from '@models/slot.model';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  soon?: boolean;
}

@Component({
  selector: 'app-sidebar-navigation',
  standalone: true,
  template: `
    <aside class="sidebar" role="navigation" aria-label="Main navigation">
      <!-- Church Identity Block -->
      <div class="church-identity">
        <div class="church-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4 7v15h6v-9h4v9h6V7l-8-5z"/>
          </svg>
        </div>
        <div class="church-info">
          <h1 class="church-name">Grace Community</h1>
          <span class="church-tagline">Doc Manager</span>
        </div>
      </div>

      <!-- Navigation Sections -->
      <nav class="nav-sections">
        <!-- Main Navigation -->
        <div class="nav-section">
          <span class="nav-section-label">Navigation</span>
          @for (item of navItems(); track item.id) {
            <a
              [href]="item.route"
              class="nav-item"
              [class.nav-item--active]="isActiveRoute(item.route)"
              [class.nav-item--soon]="item.soon"
              [attr.aria-current]="isActiveRoute(item.route) ? 'page' : null"
              [attr.aria-disabled]="item.soon"
              (click)="handleNavClick($event, item)">
              <span class="nav-item-icon" aria-hidden="true">{{ item.icon }}</span>
              <span class="nav-item-label">{{ item.label }}</span>
              @if (item.soon) {
                <span class="nav-item-soon-badge">Soon</span>
              }
            </a>
          }
        </div>
      </nav>

      <!-- User Block -->
      <div class="user-block">
        @if (user()) {
          <div class="user-info">
            <div class="user-avatar">
              {{ user()!.avatarInitials || getInitials(user()!.displayName) }}
            </div>
            <div class="user-details">
              <span class="user-name">{{ user()!.displayName }}</span>
              <span class="user-role">{{ user()!.role || 'Administrator' }}</span>
            </div>
          </div>
        }
        <button
          class="logout-button"
          (click)="onLogout()"
          aria-label="Logout">
          <span aria-hidden="true">🚪</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 280px;
      background-color: var(--color-dark-bg);
      color: var(--color-text-on-dark);
      display: flex;
      flex-direction: column;
      z-index: 100;
      overflow: hidden;
    }

    /* Church Identity Block */
    .church-identity {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      border-bottom: 1px solid var(--color-dark-border);
    }

    .church-logo {
      width: 48px;
      height: 48px;
      background-color: var(--color-primary);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .church-logo svg {
      width: 28px;
      height: 28px;
    }

    .church-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .church-name {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .church-tagline {
      font-size: 0.875rem;
      color: var(--color-text-on-dark-secondary);
      margin-top: 2px;
    }

    /* Navigation Sections */
    .nav-sections {
      flex: 1;
      padding: 16px 0;
      overflow-y: auto;
    }

    .nav-section {
      display: flex;
      flex-direction: column;
    }

    .nav-section-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-on-dark-secondary);
      opacity: 0.6;
      padding: 8px 16px;
      font-weight: 600;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      margin: 4px 8px;
      border-radius: var(--radius-md);
      color: var(--color-text-on-dark-secondary);
      text-decoration: none;
      font-size: 1rem;
      font-weight: 500;
      transition: background-color var(--transition-fast), color var(--transition-fast);
      cursor: pointer;
    }

    .nav-item:hover:not(.nav-item--soon) {
      background-color: var(--color-sidebar-hover);
      color: var(--color-text-on-dark);
    }

    .nav-item--active {
      background-color: var(--color-primary);
      color: var(--color-text-on-dark);
      position: relative;
    }

    .nav-item--active::after {
      content: '';
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 24px;
      background-color: var(--color-text-on-dark);
      border-radius: 2px 0 0 2px;
    }

    .nav-item--soon {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nav-item-icon {
      font-size: 1.25rem;
      width: 24px;
      text-align: center;
      flex-shrink: 0;
    }

    .nav-item-label {
      flex: 1;
    }

    .nav-item-soon-badge {
      font-size: 0.75rem;
      padding: 2px 8px;
      background-color: rgba(217, 119, 6, 0.2);
      color: var(--color-warning);
      border-radius: var(--radius-sm);
      font-weight: 500;
    }

    /* User Block */
    .user-block {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-top: 1px solid var(--color-dark-border);
      background-color: rgba(0, 0, 0, 0.2);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background-color: var(--color-primary);
      color: var(--color-text-on-dark);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 0.75rem;
      color: var(--color-text-on-dark-secondary);
      opacity: 0.7;
      margin-top: 2px;
    }

    .logout-button {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      color: var(--color-text-on-dark-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: background-color var(--transition-fast), color var(--transition-fast);
    }

    .logout-button:hover {
      background-color: var(--color-sidebar-hover);
      color: var(--color-text-on-dark);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidebar {
        width: 72px;
      }

      .church-info,
      .nav-item-label,
      .nav-item-soon-badge,
      .user-details {
        display: none;
      }

      .church-identity {
        justify-content: center;
        padding: 20px 12px;
      }

      .nav-item {
        justify-content: center;
        padding: 12px;
        margin: 4px;
      }

      .nav-item-icon {
        font-size: 1.5rem;
      }

      .nav-section-label {
        text-align: center;
        padding: 8px;
      }

      .user-block {
        justify-content: center;
      }

      .user-avatar {
        width: 36px;
        height: 36px;
      }
    }
  `],
})
export class SidebarNavigationComponent {
  private readonly mockData = inject(MockDataService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.mockData.user;

  readonly navItems = signal<NavItem[]>([
    { id: 'dashboard', label: 'Dashboard', icon: '📊', route: '/admin/dashboard' },
    { id: 'create', label: 'Create Slot', icon: '➕', route: '/admin/dashboard/new-slot' },
    { id: 'upload', label: 'Upload Flow', icon: '📤', route: '/admin/upload' },
    { id: 'success', label: 'Success', icon: '✓', route: '/admin/success' },
    { id: 'insights', label: 'Smart Insights', icon: '✦', route: '/admin/insights', soon: true },
  ]);

  readonly activeRoute = signal<string>('');

  constructor() {
    // Track current route for active state
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.activeRoute.set(event.urlAfterRedirects);
      });

    // Set initial route
    this.activeRoute.set(this.router.url);
  }

  isActiveRoute(route: string): boolean {
    // Upload and Success routes should not highlight any nav item
    if (route === '/admin/upload' || route === '/admin/success') {
      return false;
    }

    // Special handling for Create Slot - matches /admin/dashboard/new-slot
    if (route === '/admin/dashboard/new-slot') {
      return this.activeRoute().startsWith('/admin/dashboard/new-slot');
    }

    // Dashboard matches both /admin/dashboard and paths starting with it (except new-slot)
    if (route === '/admin/dashboard') {
      return this.activeRoute().startsWith('/admin/dashboard') &&
             !this.activeRoute().includes('/new-slot');
    }

    return this.activeRoute().startsWith(route);
  }

  handleNavClick(event: MouseEvent, item: NavItem): void {
    if (item.soon) {
      event.preventDefault();
      return;
    }
    // Allow default navigation for non-soon items
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
