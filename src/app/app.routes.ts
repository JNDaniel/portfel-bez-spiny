import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/budget-app/budget-main.component').then(m => m.BudgetMainComponent),
    title: 'Dashboard | Portfel Bez Spiny'
  },
  {
    path: 'expenses',
    loadComponent: () => import('./features/expenses/expenses.component').then(m => m.ExpensesComponent),
    title: 'Expenses | Portfel Bez Spiny'
  },
  {
    path: 'budgets',
    loadComponent: () => import('./features/budgets/budgets.component').then(m => m.BudgetsComponent),
    title: 'Budgets & Limits | Portfel Bez Spiny'
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
    title: 'Analytics & Intelligence | Portfel Bez Spiny'
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    title: 'Settings | Portfel Bez Spiny'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
