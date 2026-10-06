import { Component, inject, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../core/services/theme.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { SupportedCurrency } from '../../../core/models/settings.model';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header
      class="h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200"
    >
      <!-- Search Bar -->
      <div class="relative w-80">
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          [ngModel]="expenseService.filter().search"
          (ngModelChange)="onSearchChange($event)"
          placeholder="Search expenses, vendors, tags..."
          class="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
        />
        @if (expenseService.filter().search) {
          <button
            type="button"
            (click)="onSearchChange('')"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        }
      </div>

      <!-- Right Actions -->
      <div class="flex items-center gap-3">
        <!-- Currency Selector -->
        <div class="relative">
          <select
            [ngModel]="settingsService.currency()"
            (ngModelChange)="onCurrencyChange($event)"
            class="appearance-none text-xs font-semibold px-3 py-1.5 pr-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer border-none outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="PLN">PLN (zł)</option>
            <option value="GBP">GBP (£)</option>
          </select>
          <div
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <!-- Theme Toggle -->
        <button
          type="button"
          (click)="themeService.toggleTheme()"
          [title]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
          class="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          @if (themeService.isDark()) {
            <svg
              class="w-4 h-4 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          } @else {
            <svg
              class="w-4 h-4 text-slate-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          }
        </button>

        <!-- Add Expense Primary Button -->
        <button
          type="button"
          (click)="openAddModal.emit()"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Add Expense</span>
        </button>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly themeService = inject(ThemeService);
  readonly settingsService = inject(SettingsService);
  readonly expenseService = inject(ExpenseService);

  readonly openAddModal = output<void>();

  onSearchChange(search: string) {
    this.expenseService.updateFilter({ search });
  }

  onCurrencyChange(val: string) {
    this.settingsService.setCurrency(val as SupportedCurrency);
  }
}
