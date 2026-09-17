import { Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { BudgetStateService } from '../../core/services/budget-state.service';

Chart.register(...registerables);

@Component({
  selector: 'app-budget-trend-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full w-full rounded-3xl bg-[#111827]/90 border border-slate-800/80 p-5 md:p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xl">
      <!-- Header -->
      <div class="flex items-start justify-between mb-2">
        <div>
          <h3 class="text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">
            WYDATKI — {{ state.currentMonth().label.split(' ')[0].toUpperCase() }}
          </h3>
          <div class="flex items-center gap-1.5 mt-1 text-xs font-semibold text-rose-400">
            <span>📈</span>
            <span>{{ state.currentMonth().vsPreviousMonthPercent }}% {{ state.currentMonth().vsPreviousMonthDirection === 'more' ? 'więcej' : 'mniej' }} vs poprzedni miesiąc</span>
          </div>
        </div>
      </div>

      <!-- Chart Canvas -->
      <div class="relative w-full h-44 mt-2">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `
})
export class BudgetTrendChartComponent {
  readonly state = inject(BudgetStateService);

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  constructor() {
    effect(() => {
      const month = this.state.currentMonth();
      setTimeout(() => {
        this.renderChart(month.chartPoints);
      }, 50);
    });
  }

  private renderChart(points: { day: string; amount: number }[]) {
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
        labels: points.map(p => p.day),
        datasets: [
          {
            data: points.map(p => p.amount),
            borderColor: '#34d399',
            borderWidth: 2.5,
            tension: 0.45,
            fill: true,
            backgroundColor: gradient,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#34d399',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#94a3b8',
            bodyColor: '#34d399',
            bodyFont: { weight: 'bold' },
            padding: 8,
            displayColors: false,
            callbacks: {
              label: (item) => ` ${item.parsed?.y?.toLocaleString()} zł`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#64748b',
              font: { size: 10, family: 'JetBrains Mono, monospace' }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(51, 65, 85, 0.25)'
            },
            ticks: {
              color: '#64748b',
              font: { size: 10, family: 'JetBrains Mono, monospace' },
              callback: (val) => `${(Number(val) / 1000).toFixed(1)}k`
            }
          }
        }
      }
    });
  }
}
