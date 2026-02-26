import { Injectable, signal } from '@angular/core';

/**
 * Accessibility Service
 * Manages accessibility preferences for the application
 */
@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private readonly highContrast = signal<boolean>(false);
  private readonly largeText = signal<boolean>(false);

  /**
   * Toggle high contrast mode
   */
  toggleHighContrast(): void {
    this.highContrast.update((v) => !v);
    document.documentElement.classList.toggle('high-contrast', this.highContrast());
  }

  /**
   * Check if high contrast mode is enabled
   */
  isHighContrast(): boolean {
    return this.highContrast();
  }

  /**
   * Toggle large text mode
   */
  toggleLargeText(): void {
    this.largeText.update((v) => !v);
    document.documentElement.classList.toggle('large-text', this.largeText());
  }

  /**
   * Check if large text mode is enabled
   */
  isLargeText(): boolean {
    return this.largeText();
  }

  /**
   * Reset all accessibility settings
   */
  reset(): void {
    this.highContrast.set(false);
    this.largeText.set(false);
    document.documentElement.classList.remove('high-contrast', 'large-text');
  }
}
