import { Component, ElementRef, ViewChild, computed, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonRefresher, 
  IonRefresherContent, 
  IonFab, 
  IonFabButton, 
  IonIcon 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, refreshOutline, trendingUp, walletOutline, alertCircleOutline, barChartOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Chart, registerables } from 'chart.js';
import { ExpenseService } from '../../core/services/expense.service';
import { BudgetService } from '../../core/services/budget.service';
import { SettingsService } from '../../core/services/settings.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ExpenseFormModalComponent } from '../../shared/components/expense-form-modal/expense-form-modal.component';
import { CATEGORY_META, ExpenseCategory } from '../../core/models/expense.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    IonContent, 
    IonRefresher, 
    IonRefresherContent, 
    IonFab, 
    IonFabButton, 
    IonIcon,
    StatCardComponent, 
    ExpenseFormModalComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="ion-padding-bottom">
      <!-- Native Pull to Refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content pullingIcon="refresh-outline" pullingText="Pull to refresh expenses"></ion-refresher-content>
      </ion-refresher>

      <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Executive Dashboard</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time cost tracking, monthly burn rate, and budget allocations.</p>
          </div>
          <div class="hidden sm:flex items-center gap-3">
            <button 
              type="button" 
              (click)="openAddModal()"
              class="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition"
            >
              <ion-icon name="add" class="text-base"></ion-icon>
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        <!-- KPI Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Spent This Month -->
          <app-stat-card
            label="Spent This Month"
            [value]="settingsService.formatCurrency(expenseService.spendingSummary().spentThisMonth)"
            [subValue]="expenseService.spendingSummary().burnRatePercentage + '% of target'"
            accentColor="#0284c7"
            iconBgColor="rgba(2, 132, 199, 0.12)"
            [badgeText]="expenseService.spendingSummary().burnRatePercentage > 100 ? 'Over Budget' : 'On Track'"
            [badgeType]="expenseService.spendingSummary().burnRatePercentage > 100 ? 'negative' : 'positive'"
          >
            <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </app-stat-card>

          <!-- Monthly Target Budget -->
          <app-stat-card
            label="Monthly Budget"
            [value]="settingsService.formatCurrency(settingsService.overallMonthlyBudget())"
            subValue="Target ceiling"
            accentColor="#6366f1"
            iconBgColor="rgba(99, 102, 241, 0.12)"
            badgeText="Active Limit"
            badgeType="neutral"
          >
            <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </app-stat-card>

          <!-- Remaining Budget -->
          <app-stat-card
            label="Remaining Available"
            [value]="settingsService.formatCurrency(expenseService.spendingSummary().remainingBudgetThisMonth)"
            [subValue]="'Daily burn: ' + settingsService.formatCurrency(expenseService.spendingSummary().averageDailySpend, { hideDecimals: true })"
            accentColor="#10b981"
            iconBgColor="rgba(16, 185, 129, 0.12)"
            [badgeText]="expenseService.spendingSummary().remainingBudgetThisMonth > 0 ? 'Safe' : 'Depleted'"
            [badgeType]="expenseService.spendingSummary().remainingBudgetThisMonth > 0 ? 'positive' : 'negative'"
          >
            <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </app-stat-card>

          <!-- Total All-Time Spend -->
          <app-stat-card
            label="All-Time Expenses"
            [value]="settingsService.formatCurrency(expenseService.totalExpensesAmount())"
            [subValue]="expenseService.expenses().length + ' total records'"
            accentColor="#f59e0b"
            iconBgColor="rgba(245, 158, 11, 0.12)"
            [badgeText]="expenseService.spendingSummary().pendingTransactionsCount + ' Pending'"
            badgeType="warning"
          >
            <svg icon class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </app-stat-card>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Monthly Spending Trend (Bar Chart) -->
          <div class="lg:col-span-2 glass-card p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-sm font-bold text-slate-900 dark:text-white">6-Month Spending vs Budget</h2>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Historical trend across previous periods</p>
              </div>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Monthly Aggregation
              </span>
            </div>
            <div class="relative h-64 w-full">
              <canvas #trendChartCanvas></canvas>
            </div>
          </div>

          <!-- Category Distribution (Doughnut Chart) -->
          <div class="glass-card p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-sm font-bold text-slate-900 dark:text-white">Spend by Category</h2>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">August 2026 Distribution</p>
              </div>
            </div>
            <div class="relative h-48 w-full flex items-center justify-center">
              <canvas #categoryChartCanvas></canvas>
            </div>

            <!-- Category Legend Mini List -->
            <div class="mt-4 space-y-2 max-h-28 overflow-y-auto pr-1">
              @for (cat of expenseService.categoryBreakdowns(); track cat.category) {
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2 truncate">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.backgroundColor]="cat.color"></span>
                    <span class="text-slate-700 dark:text-slate-300 truncate">{{ cat.category }}</span>
                  </div>
                  <span class="font-bold text-slate-900 dark:text-white shrink-0">{{ settingsService.formatCurrency(cat.amount, { hideDecimals: true }) }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Budget Alerts & Recent Transactions Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Budget Health Monitor -->
          <div class="glass-card p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-bold text-slate-900 dark:text-white">Category Budget Limits</h2>
              <a routerLink="/budgets" class="text-xs font-semibold text-brand-600 hover:text-brand-500">Manage &rarr;</a>
            </div>

            <div class="space-y-4">
              @for (status of budgetService.budgetStatuses().slice(0, 4); track status.category) {
                <div>
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="font-medium text-slate-700 dark:text-slate-300">{{ status.category }}</span>
                    <span class="font-semibold" [ngClass]="{
                      'text-rose-500': status.isOverBudget,
                      'text-amber-500': status.isNearLimit,
                      'text-slate-600 dark:text-slate-400': !status.isOverBudget && !status.isNearLimit
                    }">
                      {{ settingsService.formatCurrency(status.spent, { hideDecimals: true }) }} / {{ settingsService.formatCurrency(status.budget.monthlyLimit, { hideDecimals: true }) }}
                    </span>
                  </div>
                  <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all duration-500"
                      [style.width.%]="Math.min(100, status.percentageUsed)"
                      [ngClass]="{
                        'bg-rose-500': status.isOverBudget,
                        'bg-amber-500': status.isNearLimit,
                        'bg-emerald-500': !status.isOverBudget && !status.isNearLimit
                      }"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Recent Transactions Table -->
          <div class="lg:col-span-2 glass-card p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Latest company expenses</p>
              </div>
              <a routerLink="/expenses" class="text-xs font-semibold text-brand-600 hover:text-brand-500">View All &rarr;</a>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th class="pb-2">Expense / Vendor</th>
                    <th class="pb-2">Category</th>
                    <th class="pb-2">Date</th>
                    <th class="pb-2">Status</th>
                    <th class="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (exp of recentExpenses(); track exp.id) {
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td class="py-2.5 pr-2">
                        <div class="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{{ exp.title }}</div>
                        <div class="text-[11px] text-slate-400 truncate">{{ exp.vendor }}</div>
                      </td>
                      <td class="py-2.5 pr-2">
                        <span class="px-2 py-0.5 rounded-md text-[11px] font-medium" [ngClass]="getCategoryBadgeClass(exp.category)">
                          {{ exp.category }}
                        </span>
                      </td>
                      <td class="py-2.5 pr-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{{ exp.date }}</td>
                      <td class="py-2.5 pr-2">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase" [ngClass]="{
                          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400': exp.status === 'cleared',
                          'bg-amber-500/10 text-amber-600 dark:text-amber-400': exp.status === 'pending',
                          'bg-purple-500/10 text-purple-600 dark:text-purple-400': exp.status === 'recurring'
                        }">
                          {{ exp.status }}
                        </span>
                      </td>
                      <td class="py-2.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {{ settingsService.formatCurrency(exp.amount) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Floating Action Button (FAB) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="sm:hidden mb-16 mr-3">
        <ion-fab-button (click)="openAddModal()" class="shadow-xl">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <!-- Expense Modal -->
    <app-expense-form-modal
      [isOpen]="isAddModalOpen()"
      (close)="isAddModalOpen.set(false)"
    ></app-expense-form-modal>
  `
})
export class DashboardComponent {
  readonly expenseService = inject(ExpenseService);
  readonly budgetService = inject(BudgetService);
  readonly settingsService = inject(SettingsService);
  readonly Math = Math;

  @ViewChild('trendChartCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChartCanvas') categoryCanvas!: ElementRef<HTMLCanvasElement>;

  private trendChart?: Chart;
  private categoryChart?: Chart;

  readonly isAddModalOpen = signal<boolean>(false);

  readonly recentExpenses = computed(() => {
    return this.expenseService.expenses().slice(0, 6);
  });

  constructor() {
    addIcons({ add, refreshOutline, trendingUp, walletOutline, alertCircleOutline, barChartOutline });

    effect(() => {
      const trends = this.expenseService.monthlyTrends();
      const categories = this.expenseService.categoryBreakdowns();
      const symbol = this.settingsService.currencySymbol();
      
      setTimeout(() => {
        this.renderTrendChart(trends, symbol);
        this.renderCategoryChart(categories);
      }, 50);
    });
  }

  async openAddModal() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.isAddModalOpen.set(true);
  }

  async handleRefresh(event: any) {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.expenseService.loadExpenses();
    this.budgetService.loadBudgets();
    setTimeout(() => {
      event.target.complete();
    }, 600);
  }

  getCategoryBadgeClass(category: any): string {
    const meta = CATEGORY_META[category as ExpenseCategory];
    return meta ? meta.bgColor : 'bg-slate-100 text-slate-700';
  }

  private renderTrendChart(trends: any[], symbol: string) {
    if (!this.trendCanvas) return;
    if (this.trendChart) this.trendChart.destroy();

    const ctx = this.trendCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.trendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: trends.map(t => t.label),
        datasets: [
          {
            label: 'Actual Spend',
            data: trends.map(t => t.total),
            backgroundColor: 'rgba(2, 132, 199, 0.8)',
            borderRadius: 8,
            borderSkipped: false
          },
          {
            type: 'line',
            label: 'Budget Ceiling',
            data: trends.map(t => t.budget),
            borderColor: '#ef4444',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (item) => {
                const val = item.parsed?.y;
                return val !== null && val !== undefined ? (' ' + item.dataset.label + ': ' + symbol + val.toLocaleString()) : '';
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => symbol + (Number(val) / 1000) + 'k'
            }
          }
        }
      }
    });
  }

  private renderCategoryChart(categories: any[]) {
    if (!this.categoryCanvas) return;
    if (this.categoryChart) this.categoryChart.destroy();

    const ctx = this.categoryCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories.map(c => c.category),
        datasets: [
          {
            data: categories.map(c => c.amount),
            backgroundColor: categories.map(c => c.color),
            borderWidth: 2,
            borderColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}
