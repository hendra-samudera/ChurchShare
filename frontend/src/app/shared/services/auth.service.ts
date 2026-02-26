import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MockDataService, User } from './mock-data.service';

export interface LoginRequest {
  email: string;
  password: string;
  keepLoggedIn: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  private readonly currentUser = signal<User | null>(null);
  private readonly authStatus = computed(() => this.currentUser() !== null);
  private readonly redirectUrl = signal<string>('/admin/dashboard');

  /**
   * Mock login - accepts any valid email format + any password
   * Simulates authentication delay
   */
  async login(request: LoginRequest): Promise<{ success: boolean; error?: string }> {
    await this.mockData.simulateDelay(800);

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    if (!request.password || request.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Mock successful login - call the signal to get the user object
    this.currentUser.set(this.mockData.user());

    // In real implementation, JWT would be stored in httpOnly cookie by backend
    if (request.keepLoggedIn) {
      localStorage.setItem('churchshare_mock_auth', 'true');
    }

    return { success: true };
  }

  /**
   * Mock logout
   */
  async logout(): Promise<void> {
    await this.mockData.simulateDelay(300);
    this.currentUser.set(null);
    localStorage.removeItem('churchshare_mock_auth');
    this.router.navigate(['/admin/login']);
  }

  /**
   * Check if user is authenticated (mock)
   */
  async checkAuth(): Promise<boolean> {
    const mockAuth = localStorage.getItem('churchshare_mock_auth');
    if (mockAuth === 'true') {
      this.currentUser.set(this.mockData.user());
      return true;
    }
    return false;
  }

  /**
   * Get current user (synchronous, from signal)
   */
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  /**
   * Get authentication status
   */
  isAuthenticated(): boolean {
    return this.authStatus();
  }

  /**
   * Set URL to redirect to after login
   */
  setRedirectUrl(url: string): void {
    this.redirectUrl.set(url);
  }

  /**
   * Get and clear redirect URL
   */
  getAndClearRedirectUrl(): string {
    const url = this.redirectUrl();
    this.redirectUrl.set('/admin/dashboard');
    return url;
  }
}
