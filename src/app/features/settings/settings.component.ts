import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SettingsService } from '../../core/services/settings.service';
import { ExpenseService } from '../../core/services/expense.service';
import { BudgetService } from '../../core/services/budget.service';
import { NotificationService } from '../../core/services/notification.service';
import { SupportedCurrency } from '../../core/models/settings.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <ion-content [fullscreen]="true" class="ion-padding-bottom">
      <div class="max-w-4xl space-y-8">
        <!-- Header -->
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Settings & Architecture</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure global currency, budget ceilings, full-stack REST API connection, and database backups.</p>
        </div>

        <!-- General Preferences -->
        <div class="glass-card p-6 space-y-5">
          <h2 class="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Company & Financial Defaults</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Workspace Name</label>
              <input 
                type="text" 
                [ngModel]="settingsService.settings().companyName"
                (ngModelChange)="settingsService.updateSettings({ companyName: $event })"
                class="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Display Currency</label>
              <select 
                [ngModel]="settingsService.currency()"
                (ngModelChange)="onCurrencyChange($event)"
                class="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="EUR">EUR (€) - Euro</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="PLN">PLN (zł) - Polish Zloty</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Overall Monthly Budget Target</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold">{{ settingsService.currencySymbol() }}</span>
                <input 
                  type="number" 
                  step="1000"
                  min="0"
                  [ngModel]="settingsService.overallMonthlyBudget()"
                  (ngModelChange)="settingsService.setOverallBudget(Number($event))"
                  class="w-full pl-8 pr-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Simulated Network Latency (Mock)</label>
              <input 
                type="number" 
                step="50"
                min="0"
                [ngModel]="settingsService.settings().simulateNetworkLatencyMs"
                (ngModelChange)="settingsService.updateSettings({ simulateNetworkLatencyMs: Number($event) })"
                placeholder="300 ms"
                class="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        <!-- Backend Connection & Full-Stack Switcher -->
        <div class="glass-card p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">Full-Stack Backend Connection</h2>
              <p class="text-xs text-slate-400 mt-0.5">Switch between In-Memory Mock and a live REST Backend API.</p>
            </div>
            <span 
              class="px-3 py-1 rounded-full text-xs font-semibold uppercase"
              [ngClass]="settingsService.isMockBackend() ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'"
            >
              {{ settingsService.isMockBackend() ? 'Mock Engine Active' : 'Live REST API Active' }}
            </span>
          </div>

          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="mockToggle"
                [checked]="settingsService.isMockBackend()"
                (change)="toggleMockBackend($event)"
                class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <label for="mockToggle" class="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Enable Standalone Local Mock Backend (Persistent LocalStorage with simulated async delay)
              </label>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Production REST API Base URL</label>
              <input 
                type="text" 
                [disabled]="settingsService.isMockBackend()"
                [ngModel]="settingsService.apiUrl()"
                (ngModelChange)="settingsService.updateSettings({ apiUrl: $event })"
                placeholder="https://api.yourdomain.com/v1"
                class="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-50 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p class="text-[11px] text-slate-400 mt-1">When mock mode is unchecked, all operations call this endpoint using standard HTTP services.</p>
            </div>
          </div>
        </div>

        <!-- Data Management & Backups -->
        <div class="glass-card p-6 space-y-5">
          <h2 class="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Data Management & Reset</h2>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Download Backup -->
            <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 class="text-xs font-bold text-slate-900 dark:text-white">Export Database</h4>
              <p class="text-[11px] text-slate-400">Download complete dataset as a JSON backup file.</p>
              <button 
                type="button" 
                (click)="exportJson()"
                class="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
              >
                Download JSON
              </button>
            </div>

            <!-- Restore Sample Data -->
            <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 class="text-xs font-bold text-slate-900 dark:text-white">Seed Sample Data</h4>
              <p class="text-[11px] text-slate-400">Populate realistic corporate tech spend records.</p>
              <button 
                type="button" 
                (click)="restoreSample()"
                class="w-full px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-xs font-semibold text-brand-600 dark:text-brand-400 transition"
              >
                Seed Tech Records
              </button>
            </div>

            <!-- Upload Backup -->
            <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 class="text-xs font-bold text-slate-900 dark:text-white">Import JSON</h4>
              <p class="text-[11px] text-slate-400">Restore database from a previously exported file.</p>
              <label class="block">
                <span class="w-full block text-center px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer">
                  Choose File
                </span>
                <input type="file" accept=".json" (change)="onFileImport($event)" class="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  `
})
export class SettingsComponent {
  readonly settingsService = inject(SettingsService);
  readonly expenseService = inject(ExpenseService);
  readonly budgetService = inject(BudgetService);
  readonly notificationService = inject(NotificationService);
  readonly Number = Number;

  async onCurrencyChange(val: string) {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.settingsService.setCurrency(val as SupportedCurrency);
  }

  async toggleMockBackend(e: any) {
    await Haptics.impact({ style: ImpactStyle.Medium });
    const isMock = e.target.checked;
    this.settingsService.updateSettings({ isMockBackend: isMock });
    this.notificationService.info(
      isMock ? 'Mock Backend Enabled' : 'Live REST Backend Enabled',
      isMock ? 'Using local storage mock engine.' : ('Targeting ' + this.settingsService.apiUrl())
    );
    this.expenseService.loadExpenses();
    this.budgetService.loadBudgets();
  }

  async exportJson() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.expenseService.exportJson();
  }

  async restoreSample() {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    if (confirm('Reset current data and load sample technology company expenses?')) {
      this.expenseService.resetToSampleData();
      this.budgetService.resetSampleBudgets();
    }
  }

  onFileImport(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const parsed = JSON.parse(e.target.result);
        this.expenseService.importJson(parsed);
      } catch (err: any) {
        this.notificationService.error('Import Failed', 'Invalid JSON format: ' + err.message);
      }
    };
    reader.readAsText(file);
  }
}
