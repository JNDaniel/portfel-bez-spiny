import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { BudgetService } from "../../../core/services/budget.service";

@Component({
  selector: "app-mobile-tab-bar",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)] transition-colors duration-200 shadow-lg">
      <div class="grid grid-cols-5 h-14">
        <!-- Dashboard -->
        <a 
          routerLink="/dashboard" 
          routerLinkActive="text-brand-600 dark:text-brand-400 font-bold"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 transition"
        >
          <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Dashboard</span>
        </a>

        <!-- Expenses -->
        <a 
          routerLink="/expenses" 
          routerLinkActive="text-brand-600 dark:text-brand-400 font-bold"
          class="flex flex-col items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 transition"
        >
          <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>Expenses</span>
        </a>

        <!-- Budgets -->
        <a 
          routerLink="/budgets" 
          routerLinkActive="text-brand-600 dark:text-brand-400 font-bold"
          class="flex flex-col items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 transition relative"
        >
          <div class="relative">
            <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            @if (budgetService.overBudgetCategoriesCount() > 0) {
              <span class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
            }
          </div>
          <span>Budgets</span>
        </a>

        <!-- Analytics -->
        <a 
          routerLink="/analytics" 
          routerLinkActive="text-brand-600 dark:text-brand-400 font-bold"
          class="flex flex-col items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 transition"
        >
          <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Analytics</span>
        </a>

        <!-- Settings -->
        <a 
          routerLink="/settings" 
          routerLinkActive="text-brand-600 dark:text-brand-400 font-bold"
          class="flex flex-col items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 transition"
        >
          <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </a>
      </div>
    </nav>
  `
})
export class MobileTabBarComponent {
  readonly budgetService = inject(BudgetService);
}
