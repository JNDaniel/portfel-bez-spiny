import { Component, ElementRef, ViewChild, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Chart, registerables } from 'chart.js';
import { ExpenseService } from '../../core/services/expense.service';
import { SettingsService } from '../../core/services/settings.service';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [IonContent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <ion-content [fullscreen]="true" class="ion-padding-bottom">
      <div class="space-y-6">
        <!-- Header -->
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Financial Intelligence & Analytics</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Multi-dimensional spending breakdowns, vendor concentrations, and trend forecasts.</p>
        </div>

        <!-- Top Summary Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="glass-card p-5">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Daily Run-Rate</span>
            <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {{ settingsService.formatCurrency(expenseService.spendingSummary().averageDailySpend) }}/day
            </h3>
            <p class="text-xs text-slate-400 mt-1">Calculated across active billing days</p>
          </div>

          <div class="glass-card p-5">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projected Month-End Spend</span>
            <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {{ settingsService.formatCurrency(expenseService.spendingSummary().projectedMonthlySpend) }}
            </h3>
            <p class="text-xs text-slate-400 mt-1">Based on current trajectory</p>
          </div>

          <div class="glass-card p-5">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction Density</span>
            <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {{ expenseService.expenses().length }} Transactions
            </h3>
            <p class="text-xs text-slate-400 mt-1">Avg {{ settingsService.formatCurrency(expenseService.totalExpensesAmount() / (expenseService.expenses().length || 1), { hideDecimals: true }) }} per ticket</p>
          </div>
        </div>

        <!-- Analytics Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Category Horizontal Breakdown -->
          <div class="glass-card p-5">
            <h2 class="text-sm font-bold text-slate-900 dark:text-white mb-1">Cost by Category</h2>
            <p class="text-[11px] text-slate-400 mb-4">Current month category volume</p>
            <div class="relative h-64 w-full">
              <canvas #categoryBarCanvas></canvas>
            </div>
          </div>

          <!-- Payment Method Distribution -->
          <div class="glass-card p-5">
            <h2 class="text-sm font-bold text-slate-900 dark:text-white mb-1">Payment Method Distribution</h2>
            <p class="text-[11px] text-slate-400 mb-4">Volume by payment channel</p>
            <div class="relative h-64 w-full flex items-center justify-center">
              <canvas #paymentPieCanvas></canvas>
            </div>
          </div>
        </div>

        <!-- Category Performance Table -->
        <div class="glass-card p-5">
          <h2 class="text-sm font-bold text-slate-900 dark:text-white mb-4">Category Allocation Breakdown</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th class="pb-2">Category</th>
                  <th class="pb-2">Transactions</th>
                  <th class="pb-2">Share of Spend</th>
                  <th class="pb-2 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (cat of expenseService.categoryBreakdowns(); track cat.category) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span class="w-3 h-3 rounded-full shrink-0" [style.backgroundColor]="cat.color"></span>
                      <span>{{ cat.category }}</span>
                    </td>
                    <td class="py-3 text-slate-500">{{ cat.count }} items</td>
                    <td class="py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div class="h-full rounded-full" [style.width.%]="cat.percentage" [style.backgroundColor]="cat.color"></div>
                        </div>
                        <span class="font-medium text-slate-600 dark:text-slate-300">{{ cat.percentage }}%</span>
                      </div>
                    </td>
                    <td class="py-3 text-right font-bold text-slate-900 dark:text-white">
                      {{ settingsService.formatCurrency(cat.amount) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ion-content>
  `
})
export class AnalyticsComponent {
  readonly expenseService = inject(ExpenseService);
  readonly settingsService = inject(SettingsService);

  @ViewChild('categoryBarCanvas') categoryBarCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentPieCanvas') paymentPieCanvas!: ElementRef<HTMLCanvasElement>;

  private barChart?: Chart;
  private pieChart?: Chart;

  constructor() {
    effect(() => {
      const cats = this.expenseService.categoryBreakdowns();
      const exps = this.expenseService.expenses();
      const symbol = this.settingsService.currencySymbol();

      setTimeout(() => {
        this.renderCategoryBar(cats, symbol);
        this.renderPaymentPie(exps);
      }, 50);
    });
  }

  private renderCategoryBar(cats: any[], symbol: string) {
    if (!this.categoryBarCanvas) return;
    if (this.barChart) this.barChart.destroy();

    const ctx = this.categoryBarCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: cats.map(c => c.category),
        datasets: [
          {
            label: 'Total Spent',
            data: cats.map(c => c.amount),
            backgroundColor: cats.map(c => c.color),
            borderRadius: 6
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => {
                const val = item.parsed?.x;
                return val !== null && val !== undefined ? (' ' + symbol + val.toLocaleString()) : '';
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { callback: (val) => symbol + (Number(val) / 1000) + 'k' }
          }
        }
      }
    });
  }

  private renderPaymentPie(expenses: any[]) {
    if (!this.paymentPieCanvas) return;
    if (this.pieChart) this.pieChart.destroy();

    const ctx = this.paymentPieCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.paymentMethod, (map.get(e.paymentMethod) || 0) + e.amount);
    }

    const labels = Array.from(map.keys());
    const data = Array.from(map.values());
    const colors = ['#0284c7', '#6366f1', '#10b981', '#f59e0b', '#ec4899'];

    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' }
        }
      }
    });
  }
}
