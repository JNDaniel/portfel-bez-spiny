import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetStateService } from '../../core/services/budget-state.service';

@Component({
  selector: 'app-budget-ai-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (state.isAiSummaryOpen()) {
      <div class="w-full rounded-3xl bg-[#111827]/95 border border-purple-500/30 p-5 md:p-6 shadow-2xl backdrop-blur-xl space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <!-- Header -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div class="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <span class="text-base">✨</span>
            <span>Podsumowanie AI — {{ state.currentMonth().label.split(' ')[0] }}</span>
          </div>
          <button 
            type="button" 
            (click)="state.toggleAiSummary()"
            class="text-slate-400 hover:text-white text-xs font-semibold p-1 hover:bg-slate-800/60 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        <!-- 4 AI Summary Cards (Matching Screenshot 3) -->
        <div class="space-y-3">
          <!-- 1. Największy wydatek (Red) -->
          <div class="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/40 flex items-start gap-3">
            <div class="w-7 h-7 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-sm shrink-0">
              📈
            </div>
            <div>
              <h4 class="text-xs font-bold text-rose-400">Największy wydatek</h4>
              <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {{ state.currentMonth().aiSummary.biggestExpense }}
              </p>
            </div>
          </div>

          <!-- 2. Potencjalnie zbędne (Amber) -->
          <div class="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-900/40 flex items-start gap-3">
            <div class="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm shrink-0">
              ⚠️
            </div>
            <div>
              <h4 class="text-xs font-bold text-amber-400">Potencjalnie zbędne</h4>
              <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {{ state.currentMonth().aiSummary.potentialWaste }}
              </p>
            </div>
          </div>

          <!-- 3. Dobra wiadomość (Green) -->
          <div class="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 flex items-start gap-3">
            <div class="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm shrink-0">
              📉
            </div>
            <div>
              <h4 class="text-xs font-bold text-emerald-400">Dobra wiadomość</h4>
              <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {{ state.currentMonth().aiSummary.goodNews }}
              </p>
            </div>
          </div>

          <!-- 4. Rekomendacja AI (Purple) -->
          <div class="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-900/40 flex items-start gap-3">
            <div class="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-sm shrink-0">
              ✨
            </div>
            <div>
              <h4 class="text-xs font-bold text-purple-400">Rekomendacja AI</h4>
              <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {{ state.currentMonth().aiSummary.recommendation }}
              </p>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class BudgetAiSummaryComponent {
  readonly state = inject(BudgetStateService);
}
