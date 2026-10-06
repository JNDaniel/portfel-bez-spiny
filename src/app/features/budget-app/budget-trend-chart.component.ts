import {
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { CumulativeSeries } from '../../core/domain/budget-summary';
import { formatAxisZloty } from '../../core/domain/money';
import { BudgetStateService } from '../../core/services/budget-state.service';

Chart.register(...registerables);

@Component({
  selector: 'app-budget-trend-chart',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="h-full w-full rounded-3xl bg-[#111827]/90 border border-slate-800/80 p-5 md:p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xl"
    >
      <!-- Header -->
      <div class="flex items-start justify-between mb-2">
        <div>
          <h3
            class="text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider font-mono"
          >
            WYDATKI — {{ state.currentMonthLabel().split(' ')[0].toUpperCase() }}
          </h3>
          @if (state.vsPreviousMonth(); as cmp) {
            <div
              class="flex items-center gap-1.5 mt-1 text-xs font-semibold"
              [class.text-rose-400]="cmp.direction === 'more'"
              [class.text-emerald-400]="cmp.direction === 'less'"
            >
              <span>📈</span>
              <span
                >{{ cmp.percent }}% {{ cmp.direction === 'more' ? 'więcej' : 'mniej' }} vs poprzedni
                miesiąc</span
              >
            </div>
          }
        </div>
      </div>

      <!-- Chart Canvas -->
      <div class="relative w-full h-44 mt-2">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
})
export class BudgetTrendChartComponent {
  readonly state = inject(BudgetStateService);

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  constructor() {
    effect(() => {
      const trend = this.state.trend();
      setTimeout(() => {
        this.renderChart(trend);
      }, 50);
    });
  }

  private renderChart(trend: CumulativeSeries) {
    if (!this.chartCanvas) return;
    if (this.chart) this.chart.destroy();

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 160);
    gradient.addColorStop(0, 'rgba(52, 211, 153, 0.25)');
    gradient.addColorStop(1, 'rgba(52, 211, 153, 0.0)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trend.labels,
        datasets: [
          {
            label: 'W limicie',
            data: trend.inLimitMinor.map((minor) => minor / 100),
            borderColor: '#34d399',
            borderWidth: 2.5,
            tension: 0.45,
            fill: true,
            backgroundColor: gradient,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#34d399',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
          },
          {
            label: 'Okazje',
            data: trend.occasionalMinor.map((minor) => minor / 100),
            borderColor: '#a78bfa',
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.45,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#a78bfa',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              boxWidth: 12,
              font: { size: 10, family: 'JetBrains Mono, monospace' },
            },
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#94a3b8',
            bodyColor: '#e2e8f0',
            bodyFont: { weight: 'bold' },
            padding: 8,
            callbacks: {
              label: (item) => ` ${item.dataset.label}: ${item.parsed?.y?.toLocaleString()} zł`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#64748b',
              font: { size: 10, family: 'JetBrains Mono, monospace' },
            },
          },
          y: {
            beginAtZero: true,
            suggestedMax: 100,
            grid: {
              color: 'rgba(51, 65, 85, 0.25)',
            },
            ticks: {
              color: '#64748b',
              font: { size: 10, family: 'JetBrains Mono, monospace' },
              precision: 0,
              maxTicksLimit: 6,
              callback: (val) => formatAxisZloty(Number(val)),
            },
          },
        },
      },
    });
  }
}
