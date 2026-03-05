import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User } from '@models/slot.model';
import { environment } from '@environments/environment';

const TOKEN_KEY = 'churchshare_token';
const USER_KEY = 'churchshare_user';

export interface LoginRequest {
  email: string;
  password: string;
  keepLoggedIn: boolean;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly currentUser = signal<User | null>(null);
  private readonly authStatus = computed(() => this.currentUser() !== null);
  private readonly redirectUrl = signal<string>('/admin/dashboard');

  /**
   * Authenticate against the backend API
   */
  async login(request: LoginRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiUrl}/admin/auth/login`, {
          email: request.email,
          password: request.password,
          keepLoggedIn: request.keepLoggedIn,
        })
      );

      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      this.currentUser.set(response.user);

      return { success: true };
    } catch (err) {
      const message =
        err instanceof HttpErrorResponse && err.error?.message
          ? err.error.message
          : 'Login failed. Please try again.';
      return { success: false, error: message };
    }
  }

  /**
   * Clear auth state and navigate to login
   */
  async logout(): Promise<void> {
    this.currentUser.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/admin/login']);
  }

  /**
   * Restore session from localStorage if a token exists
   */
  async checkAuth(): Promise<boolean> {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    if (token && userJson) {
      try {
        const user: User = JSON.parse(userJson);
        this.currentUser.set(user);
        return true;
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    return false;
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  isAuthenticated(): boolean {
    return this.authStatus();
  }

  setRedirectUrl(url: string): void {
    this.redirectUrl.set(url);
  }

  getAndClearRedirectUrl(): string {
    const url = this.redirectUrl();
    this.redirectUrl.set('/admin/dashboard');
    return url;
  }
}
