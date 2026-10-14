import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/budget-app/budget-main.component').then((m) => m.BudgetMainComponent),
    title: 'Dashboard | Portfel Bez Spiny',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
