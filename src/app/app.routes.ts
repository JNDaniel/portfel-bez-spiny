import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/budget-app/budget-main.component').then((m) => m.BudgetMainComponent),
    title: 'Dashboard | Portfel Bez Spiny',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
