import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './shared/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zoneless change detection (Angular v21 default)
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router with routes
    provideRouter(routes),

    // HTTP Client with interceptors
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
  ],
};
