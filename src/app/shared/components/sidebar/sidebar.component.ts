import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { BudgetService } from "../../../core/services/budget.service";
import { SettingsService } from "../../../core/services/settings.service";
import { ExpenseService } from "../../../core/services/expense.service";

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen select-none transition-colors duration-200">
      <!-- Logo & Brand Header -->
      <div class="h-16 px-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <span class="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Portfel <span class="text-brand-500">Bez Spiny</span></span>
          <span class="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">Osobiste finanse</span>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <a 
          routerLink="/dashboard" 
          routerLinkActive="bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 font-semibold"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-all group"
        >
          <svg class="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Dashboard</span>
        </a>

        <a 
          routerLink="/expenses" 
          routerLinkActive="bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 font-semibold"
          class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-all group"
        >
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>Expenses</span>
          </div>
        </a>

        <a 
          routerLink="/budgets" 
          routerLinkActive="bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 font-semibold"
          class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-all group"
        >
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Budgets & Limits</span>
          </div>
          @if (budgetService.overBudgetCategoriesCount() > 0) {
            <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {{ budgetService.overBudgetCategoriesCount() }} alert
            </span>
          }
        </a>

        <a 
          routerLink="/analytics" 
          routerLinkActive="bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 font-semibold"
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-all group"
        >
          <svg class="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Analytics & Reports</span>
        </a>

        <a 
          routerLink="/settings" 
          routerLinkActive="bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 font-semibold"
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-all group"
        >
          <svg class="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings & Data</span>
        </a>
      </nav>

      <!-- Bottom Mini Card -->
      <div class="p-4 m-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
        <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span>Target Budget</span>
          <span class="font-bold text-slate-900 dark:text-white">{{ settingsService.formatCurrency(settingsService.overallMonthlyBudget(), { hideDecimals: true }) }}</span>
        </div>
        <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div 
            class="h-full rounded-full transition-all duration-500"
            [style.width.%]="Math.min(100, (expenseService.currentMonthSpent() / settingsService.overallMonthlyBudget()) * 100)"
            [ngClass]="{
              'bg-emerald-500': (expenseService.currentMonthSpent() / settingsService.overallMonthlyBudget()) < 0.8,
              'bg-amber-500': (expenseService.currentMonthSpent() / settingsService.overallMonthlyBudget()) >= 0.8 && (expenseService.currentMonthSpent() / settingsService.overallMonthlyBudget()) <= 1,
              'bg-rose-500': (expenseService.currentMonthSpent() / settingsService.overallMonthlyBudget()) > 1
            }"
          ></div>
        </div>
        <div class="text-[11px] text-slate-400 mt-2 flex justify-between">
          <span>Spent: {{ settingsService.formatCurrency(expenseService.currentMonthSpent(), { hideDecimals: true }) }}</span>
          <span>{{ Math.round((expenseService.currentMonthSpent() / settingsService.overallMonthlyBudget()) * 100) }}%</span>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  readonly budgetService = inject(BudgetService);
  readonly settingsService = inject(SettingsService);
  readonly expenseService = inject(ExpenseService);
  readonly Math = Math;
}
