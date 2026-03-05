import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const TOKEN_KEY = 'churchshare_token';
const USER_KEY = 'churchshare_user';

/**
 * HTTP Interceptor for JWT Authentication
 *
 * Attaches Bearer token to outgoing API requests and
 * handles 401 responses by clearing auth state and redirecting to login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_KEY);

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        router.navigate(['/admin/login']);
      }
      return throwError(() => error);
    })
  );
};
