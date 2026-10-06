import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { BudgetStateService } from '../../core/services/budget-state.service';

@Component({
  selector: 'app-budget-subscriptions',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (state.isSubscriptionsOpen()) {
      <div
        class="w-full rounded-3xl bg-[#111827]/95 border border-blue-500/30 p-5 md:p-6 shadow-2xl backdrop-blur-xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- Header -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div class="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <span class="text-base">🔄</span>
            <span>Subskrypcje i Stałe Płatności Cykliczne</span>
          </div>
          <button
            type="button"
            (click)="state.isSubscriptionsOpen.set(false)"
            class="text-slate-400 hover:text-white text-xs font-semibold p-1 hover:bg-slate-800 rounded-lg"
          >
            ✕
          </button>
        </div>

        <!-- Total Fixed Monthly Cost Banner -->
        <div
          class="p-4 rounded-2xl bg-blue-950/20 border border-blue-900/40 flex items-center justify-between"
        >
          <div>
            <span class="text-[11px] uppercase font-bold text-blue-400 tracking-wider"
              >Stały koszt życia</span
            >
            <div class="text-2xl font-black text-white mt-0.5 font-mono">
              {{ state.totalRecurringMonthly() }} zł / mies.
            </div>
          </div>
          <div class="text-right text-xs text-slate-400">
            <span>{{ state.subscriptions().length }} aktywnych usług</span>
            <span class="block text-slate-500 text-[10px]">Autoodnawianie</span>
          </div>
        </div>

        <!-- Timeline List -->
        <div class="space-y-2.5">
          @for (sub of state.subscriptions(); track sub.id) {
            <div
              class="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs hover:border-slate-700 transition"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-base"
                >
                  {{ sub.iconEmoji }}
                </div>
                <div>
                  <span class="font-bold text-white text-sm block">{{ sub.name }}</span>
                  <span class="text-slate-400 text-[11px]">
                    Pobranie {{ sub.billingDay }}. dnia miesiąca &bull;
                    <strong class="text-blue-400">za {{ sub.daysUntilBilling }} dni</strong>
                  </span>
                </div>
              </div>

              <div class="text-right">
                <span class="font-mono text-white font-bold text-sm block"
                  >-{{ sub.amount.toFixed(2) }} zł</span
                >
                <span class="text-[10px] text-slate-500 uppercase">miesięcznie</span>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class BudgetSubscriptionsComponent {
  readonly state = inject(BudgetStateService);
}
