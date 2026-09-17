import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonRefresher, 
  IonRefresherContent 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline, createOutline, alertCircleOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { BudgetService } from '../../core/services/budget.service';
import { ExpenseService } from '../../core/services/expense.service';
import { SettingsService } from '../../core/services/settings.service';
import { CATEGORY_META, ExpenseCategory } from '../../core/models/expense.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonRefresher, 
    IonRefresherContent, 
    ModalComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="ion-padding-bottom">
      <!-- Native Pull to Refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content pullingIcon="refresh-outline" pullingText="Pull to refresh budgets"></ion-refresher-content>
      </ion-refresher>

      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Category Budgets & Limits</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure spending limits, warning thresholds, and observe burn rates.</p>
          </div>

          <div class="flex items-center gap-2">
            <button 
              type="button" 
              (click)="resetSample()"
              class="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Reset Default Limits
            </button>
          </div>
        </div>

        <!-- Budget Allocation Overview Card -->
        <div class="glass-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Allocated Limits</span>
            <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {{ settingsService.formatCurrency(budgetService.totalBudgetLimit()) }}
            </h3>
            <p class="text-xs text-slate-400 mt-1">Sum of all category limits</p>
          </div>

          <div>
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Month Spent</span>
            <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {{ settingsService.formatCurrency(expenseService.currentMonthSpent()) }}
            </h3>
            <p class="text-xs text-slate-400 mt-1">{{ Math.round((expenseService.currentMonthSpent() / (budgetService.totalBudgetLimit() || 1)) * 100) }}% of allocated limit</p>
          </div>

          <div>
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Budget Health Alerts</span>
            <div class="flex items-center gap-2 mt-2">
              @if (budgetService.overBudgetCategoriesCount() > 0) {
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  {{ budgetService.overBudgetCategoriesCount() }} Over Limit
                </span>
              }
              @if (budgetService.nearLimitCategoriesCount() > 0) {
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  {{ budgetService.nearLimitCategoriesCount() }} Near Threshold
                </span>
              }
              @if (budgetService.overBudgetCategoriesCount() === 0 && budgetService.nearLimitCategoriesCount() === 0) {
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  All Categories Healthy
                </span>
              }
            </div>
          </div>
        </div>

        <!-- Categories Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (item of budgetService.budgetStatuses(); track item.category) {
            <div class="glass-card p-5 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
              <div class="flex items-center justify-between mb-3">
                <span class="px-2.5 py-1 rounded-lg text-xs font-semibold" [ngClass]="getCategoryBadgeClass(item.category)">
                  {{ item.category }}
                </span>
                <button 
                  type="button" 
                  (click)="openEditModal(item)"
                  class="text-xs font-semibold text-brand-600 hover:text-brand-500"
                >
                  Edit Limit
                </button>
              </div>

              <div class="flex items-baseline justify-between mt-4">
                <div>
                  <span class="text-[11px] text-slate-400 uppercase font-semibold">Spent this month</span>
                  <div class="text-xl font-bold text-slate-900 dark:text-white">
                    {{ settingsService.formatCurrency(item.spent) }}
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-[11px] text-slate-400 uppercase font-semibold">Monthly Limit</span>
                  <div class="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {{ settingsService.formatCurrency(item.budget.monthlyLimit) }}
                  </div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mt-4">
                <div class="flex justify-between text-xs font-medium mb-1.5">
                  <span [ngClass]="{
                    'text-rose-500 font-bold': item.isOverBudget,
                    'text-amber-500 font-bold': item.isNearLimit,
                    'text-slate-500': !item.isOverBudget && !item.isNearLimit
                  }">
                    {{ item.percentageUsed }}% Used
                  </span>
                  <span class="text-slate-400">
                    {{ item.remaining >= 0 ? settingsService.formatCurrency(item.remaining, { hideDecimals: true }) + ' left' : settingsService.formatCurrency(Math.abs(item.remaining), { hideDecimals: true }) + ' over limit' }}
                  </span>
                </div>

                <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    [style.width.%]="Math.min(100, item.percentageUsed)"
                    [ngClass]="{
                      'bg-rose-500': item.isOverBudget,
                      'bg-amber-500': item.isNearLimit,
                      'bg-emerald-500': !item.isOverBudget && !item.isNearLimit
                    }"
                  ></div>
                </div>
              </div>

              @if (item.budget.notes) {
                <p class="text-[11px] text-slate-400 mt-3 italic truncate">{{ item.budget.notes }}</p>
              }
            </div>
          }
        </div>
      </div>
    </ion-content>

    <!-- Edit Limit Modal -->
    <app-modal
      [isOpen]="isModalOpen()"
      [title]="'Edit Budget Limit: ' + editingCategory()"
      size="sm"
      (close)="isModalOpen.set(false)"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Spending Limit ({{ settingsService.currency() }})</label>
          <input 
            type="number" 
            [(ngModel)]="editMonthlyLimit"
            min="100"
            step="100"
            class="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Alert Warning Threshold (%)</label>
          <input 
            type="number" 
            [(ngModel)]="editThreshold"
            min="50"
            max="100"
            class="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes / Description</label>
          <textarea 
            [(ngModel)]="editNotes"
            rows="2"
            class="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button 
            type="button" 
            (click)="isModalOpen.set(false)"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button 
            type="button" 
            (click)="saveBudget()"
            class="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow transition"
          >
            Save Limit
          </button>
        </div>
      </div>
    </app-modal>
  `
})
export class BudgetsComponent {
  readonly budgetService = inject(BudgetService);
  readonly expenseService = inject(ExpenseService);
  readonly settingsService = inject(SettingsService);
  readonly Math = Math;

  readonly isModalOpen = signal<boolean>(false);
  readonly editingCategory = signal<ExpenseCategory>('Cloud & Infrastructure');
  
  editMonthlyLimit: number = 5000;
  editThreshold: number = 80;
  editNotes: string = '';

  constructor() {
    addIcons({ refreshOutline, createOutline, alertCircleOutline });
  }

  async handleRefresh(event: any) {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.budgetService.loadBudgets();
    setTimeout(() => {
      event.target.complete();
    }, 600);
  }

  getCategoryBadgeClass(category: any): string {
    const meta = CATEGORY_META[category as ExpenseCategory];
    return meta ? meta.bgColor : 'bg-slate-100 text-slate-700';
  }

  async openEditModal(item: any) {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.editingCategory.set(item.category);
    this.editMonthlyLimit = item.budget.monthlyLimit;
    this.editThreshold = item.budget.alertThresholdPercent;
    this.editNotes = item.budget.notes || '';
    this.isModalOpen.set(true);
  }

  async saveBudget() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.budgetService.createOrUpdateBudget({
      category: this.editingCategory(),
      monthlyLimit: Number(this.editMonthlyLimit),
      period: '2026-08',
      alertThresholdPercent: Number(this.editThreshold),
      notes: this.editNotes
    });
    this.isModalOpen.set(false);
  }

  async resetSample() {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    if (confirm('Reset default budgets limits?')) {
      this.budgetService.resetSampleBudgets();
    }
  }
}
