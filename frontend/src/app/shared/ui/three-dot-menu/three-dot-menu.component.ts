import { Component, input, output, signal, ElementRef, inject, HostListener } from '@angular/core';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  danger?: boolean;
  soon?: boolean;
}

@Component({
  selector: 'app-three-dot-menu',
  standalone: true,
  template: `
    <div class="menu-container">
      <button
        class="menu-trigger"
        (click)="toggleMenu()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-haspopup]="true">
        <span aria-hidden="true">⋮</span>
      </button>

      @if (isOpen()) {
        <div
          class="menu-dropdown"
          [class.menu-dropdown--open]="isOpen()"
          role="menu"
          [attr.aria-label]="ariaLabel()">
          @for (item of items(); track item.id) {
            <button
              class="menu-item"
              [class.menu-item--disabled]="item.disabled || item.soon"
              [class.menu-item--danger]="item.danger"
              [class.menu-item--soon]="item.soon"
              (click)="onItemClick($event, item)"
              [attr.aria-disabled]="item.disabled || item.soon"
              role="menuitem">
              @if (item.icon) {
                <span class="menu-item-icon" aria-hidden="true">{{ item.icon }}</span>
              }
              <span class="menu-item-label">{{ item.label }}</span>
              @if (item.soon) {
                <span class="menu-item-soon-badge">Soon</span>
              }
            </button>
          }
        </div>
      }

      @if (isOpen()) {
        <div class="menu-backdrop" (click)="closeMenu()"></div>
      }
    </div>
  `,
  styles: [`
    .menu-container {
      position: relative;
      display: inline-block;
    }

    .menu-trigger {
      min-width: 44px;
      min-height: 44px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: var(--color-text-secondary);
      transition: background-color var(--transition-fast);
    }

    .menu-trigger:hover {
      background-color: var(--color-surface);
    }

    .menu-trigger:active {
      background-color: var(--color-border-light);
    }

    .menu-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      min-width: 200px;
      background-color: var(--color-background);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-border);
      padding: 8px 0;
      z-index: 1000;
      opacity: 0;
      transform: translateY(-8px);
      pointer-events: none;
      transition: opacity var(--transition-fast), transform var(--transition-fast);
    }

    .menu-dropdown--open {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      color: var(--color-text-primary);
      text-align: left;
      transition: background-color var(--transition-fast);
      position: relative;
    }

    .menu-item:hover:not(.menu-item--disabled) {
      background-color: var(--color-surface);
    }

    .menu-item:active:not(.menu-item--disabled) {
      background-color: var(--color-border-light);
    }

    .menu-item--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .menu-item--danger {
      color: var(--color-error);
    }

    .menu-item--danger:hover:not(.menu-item--disabled) {
      background-color: var(--color-error-bg);
    }

    .menu-item--soon {
      opacity: 0.6;
    }

    .menu-item-icon {
      font-size: 1.125rem;
      width: 24px;
      text-align: center;
    }

    .menu-item-label {
      flex: 1;
    }

    .menu-item-soon-badge {
      font-size: 0.75rem;
      padding: 2px 8px;
      background-color: var(--color-warning-bg);
      color: var(--color-warning);
      border-radius: var(--radius-sm);
      font-weight: 500;
    }

    .menu-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
    }
  `],
})
export class ThreeDotMenuComponent {
  items = input.required<MenuItem[]>();
  ariaLabel = input<string>('More options');

  itemClicked = output<string>();

  readonly isOpen = signal(false);
  private readonly elementRef = inject(ElementRef);

  toggleMenu(): void {
    this.isOpen.update(open => !open);
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  onItemClick(event: MouseEvent, item: MenuItem): void {
    event.stopPropagation();
    if (item.disabled || item.soon) {
      return;
    }
    this.closeMenu();
    this.itemClicked.emit(item.id);
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isOpen()) {
      this.closeMenu();
    }
  }
}
