import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./admin/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    // canActivate: [authGuard], // TODO: Implement auth guard
    children: [
      {
        path: 'new-slot',
        loadComponent: () =>
          import('./admin/new-slot-page/new-slot-page.component').then(
            (m) => m.NewSlotPageComponent
          ),
      },
    ],
  },
  {
    path: 'admin/slots/create',
    redirectTo: 'admin/dashboard/new-slot',
  },
  {
    path: 'admin/upload/:slotId',
    loadComponent: () =>
      import('./admin/upload/upload-flow.component').then(
        (m) => m.UploadFlowComponent
      ),
    // canActivate: [authGuard],
  },
  {
    path: 'admin/success/:slotId',
    loadComponent: () =>
      import('./admin/success/success-confirmation.component').then(
        (m) => m.SuccessConfirmationComponent
      ),
    // canActivate: [authGuard],
  },
  {
    path: 'view/:slug',
    loadComponent: () =>
      import('./public-viewer/public-viewer.component').then(
        (m) => m.PublicViewerComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'admin/dashboard',
  },
];
