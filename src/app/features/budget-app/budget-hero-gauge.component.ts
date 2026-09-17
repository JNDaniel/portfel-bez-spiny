import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetStateService } from '../../core/services/budget-state.service';

@Component({
  selector: 'app-budget-hero-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full rounded-3xl bg-[#111827]/90 border border-slate-800/80 p-6 md:p-8 flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl">
      <!-- Glow ambient light behind gauge -->
      <div 
        class="absolute top-6 w-52 h-52 rounded-full blur-3xl opacity-25 transition-all duration-700 pointer-events-none"
        [style.backgroundColor]="gaugeColor()"
      ></div>

      <!-- Circular Open-Arc Gauge (250 degree sweep matching Screenshot 1) -->
      <div class="relative w-64 h-56 flex flex-col items-center justify-center">
        <svg class="w-64 h-64 transform rotate-[145deg]" viewBox="0 0 200 200">
          <!-- Background Inactive Track (250° Arc) -->
          <circle
            cx="100"
            cy="100"
            r="72"
            stroke="currentColor"
            stroke-width="12"
            fill="transparent"
            class="text-slate-800/80"
            stroke-dasharray="320 452"
            stroke-linecap="round"
          />

          <!-- Active Glowing Gradient Arc (52%) -->
          <circle
            cx="100"
            cy="100"
            r="72"
            stroke="url(#heroGaugeGradient)"
            stroke-width="12"
            fill="transparent"
            stroke-dasharray="320 452"
            [style.strokeDashoffset]="strokeDashoffset()"
            stroke-linecap="round"
            class="transition-all duration-1000 ease-out"
            [style.filter]="'drop-shadow(0 0 10px ' + gaugeColor() + ')'"
          />

          <defs>
            <linearGradient id="heroGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" [attr.stop-color]="gaugeStartColor()" />
              <stop offset="100%" [attr.stop-color]="gaugeColor()" />
            </linearGradient>
          </defs>
        </svg>

        <!-- Centered Percentage & Subtitle -->
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center -mt-2">
          <span 
            class="text-4xl md:text-5xl font-black tracking-tight"
            [style.color]="gaugeColor()"
            [style.textShadow]="'0 0 25px ' + gaugeColor() + '60'"
          >
            {{ state.percentageUsed() }}%
          </span>
          <span class="text-xs text-slate-400 font-medium mt-1 select-none">
            wykorzystano budżetu
          </span>
        </div>
      </div>

      <!-- Safe-to-Spend Daily Allowance Pill -->
      <div class="mb-4 -mt-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 flex items-center gap-2 shadow-lg backdrop-blur-md">
        <span class="text-xs">🎯</span>
        <span class="text-xs text-slate-300">
          Bezpiecznie na dziś: <strong class="text-emerald-400 font-bold font-mono">{{ state.safeToSpendDaily() }} zł/dzień</strong> do końca miesiąca
        </span>
      </div>

      <!-- 3 Key Metric Numbers at Bottom -->
      <div class="grid grid-cols-3 w-full max-w-md pt-4 border-t border-slate-800/60 text-center">
        <div>
          <span class="block text-[10px] md:text-xs uppercase font-bold text-slate-500 tracking-wider">WYDANO</span>
          <span class="block text-base md:text-lg font-extrabold text-white mt-0.5 font-mono">
            {{ state.spentAmount() }} zł
          </span>
        </div>

        <div>
          <span class="block text-[10px] md:text-xs uppercase font-bold text-slate-500 tracking-wider">LIMIT</span>
          <span class="block text-base md:text-lg font-extrabold text-white mt-0.5 font-mono">
            {{ state.limitAmount() }} zł
          </span>
        </div>

        <div>
          <span class="block text-[10px] md:text-xs uppercase font-bold text-slate-500 tracking-wider">POZOSTAŁO</span>
          <span 
            class="block text-base md:text-lg font-extrabold mt-0.5 font-mono"
            [ngClass]="state.remainingAmount() >= 0 ? 'text-emerald-400' : 'text-rose-400'"
          >
            {{ state.remainingAmount() }} zł
          </span>
        </div>
      </div>
    </div>
  `
})
export class BudgetHeroGaugeComponent {
  readonly state = inject(BudgetStateService);

  readonly gaugeColor = computed(() => {
    const pct = this.state.percentageUsed();
    if (pct < 75) return '#34d399';
    if (pct < 100) return '#fbbf24';
    return '#f43f5e';
  });

  readonly gaugeStartColor = computed(() => {
    const pct = this.state.percentageUsed();
    if (pct < 75) return '#10b981';
    if (pct < 100) return '#f59e0b';
    return '#e11d48';
  });

  readonly strokeDashoffset = computed(() => {
    const totalArcLength = 320; // 250 degree sweep
    const pct = Math.min(100, Math.max(0, this.state.percentageUsed()));
    return totalArcLength - (totalArcLength * (pct / 100));
  });
}
