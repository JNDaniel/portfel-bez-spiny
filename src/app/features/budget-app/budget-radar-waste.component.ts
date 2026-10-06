import { Component, inject } from '@angular/core';
import { BudgetStateService } from '../../core/services/budget-state.service';

@Component({
  selector: 'app-budget-radar-waste',
  standalone: true,
  imports: [],
  template: `
    @if (state.isWasteRadarOpen()) {
      <div class="w-full rounded-3xl bg-[#111827]/95 border border-amber-500/30 p-5 md:p-6 shadow-2xl backdrop-blur-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div class="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <span class="text-base">🚨</span>
            <span>Radar Drenażu Portfela (Zachcianki & Zbędne)</span>
          </div>
          <button 
            type="button" 
            (click)="state.isWasteRadarOpen.set(false)"
            class="text-slate-400 hover:text-white text-xs font-semibold p-1 hover:bg-slate-800 rounded-lg"
          >
            ✕
          </button>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-900/40">
            <span class="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Suma zachcianek</span>
            <div class="text-xl font-extrabold text-white mt-0.5 font-mono">
              {{ state.wasteStats().totalAmount.toFixed(2) }} zł
            </div>
            <span class="text-[11px] text-slate-400">{{ state.wasteStats().percentageOfSpend }}% całkowitych wydatków</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/40">
            <span class="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Liczba pozycji</span>
            <div class="text-xl font-extrabold text-white mt-0.5 font-mono">
              {{ state.wasteStats().items.length }} transakcji
            </div>
            <span class="text-[11px] text-slate-400">Impulsy nocne i zachcianki</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40">
            <span class="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Potencjał oszczędności</span>
            <div class="text-xl font-extrabold text-emerald-400 mt-0.5 font-mono">
              +{{ state.wasteStats().potentialAnnualSavings }} zł/rok
            </div>
            <span class="text-[11px] text-slate-400">Przy redukcji o 50%</span>
          </div>
        </div>

        <!-- Waste Items Mini List -->
        <div class="space-y-2 pt-1">
          @for (item of state.wasteStats().items; track item.id) {
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <div class="flex items-center gap-2">
                <span class="text-amber-400">⚠️</span>
                <span class="font-bold text-white">{{ item.title }}</span>
                <span class="text-slate-500">({{ item.date }})</span>
              </div>
              <span class="font-mono text-rose-400 font-bold">-{{ item.amount.toFixed(2) }} zł</span>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class BudgetRadarWasteComponent {
  readonly state = inject(BudgetStateService);
}
