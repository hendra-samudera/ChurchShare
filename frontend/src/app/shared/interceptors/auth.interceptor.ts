import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor for JWT Authentication
 *
 * NOTE: For mock implementation, JWT is simulated.
 * In production, JWT will be stored in httpOnly cookie by backend.
 * 
 * Purpose:
 * - Handle 401 errors (session expired)
 * - Redirect to login when authentication fails
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Session expired - redirect to login
        // TODO: Implement AuthService and redirect logic
        console.warn('Session expired. Redirecting to login...');
        // authService.handleSessionExpired();
      }
      return throwError(() => error);
    })
  );
};
