import { Component, inject } from '@angular/core';
import { BudgetStateService } from '../../core/services/budget-state.service';

@Component({
  selector: 'app-budget-bank-simulator',
  standalone: true,
  imports: [],
  template: `
    <!-- Top Floating Bank Notification Card (Matching Android / iOS Push) -->
    @if (state.activeBankNotification(); as notif) {
      <div class="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-top-4 duration-300">
        <div class="rounded-3xl bg-slate-900/95 border-2 border-emerald-500/80 p-4 shadow-2xl backdrop-blur-xl space-y-3 ring-4 ring-emerald-500/20">
          <!-- Notification Top Bar -->
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span class="font-extrabold uppercase tracking-wider text-emerald-400 font-mono">{{ notif.bankName }}</span>
              <span class="text-slate-500">&bull; {{ notif.time }}</span>
            </div>
            <button 
              type="button" 
              (click)="state.dismissBankNotification()"
              class="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          <!-- Notification Body -->
          <div>
            <h4 class="text-sm font-bold text-white">{{ notif.rawText }}</h4>
            <div class="flex items-center gap-2 mt-1 text-xs text-slate-300">
              <span>Sugerowane: <strong>{{ notif.suggestedCategory }}</strong></span>
              <span>&bull;</span>
              <span class="font-mono text-emerald-400 font-bold">-{{ notif.amount.toFixed(2) }} zł</span>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex items-center gap-2 pt-1">
            <button 
              type="button" 
              (click)="state.acceptBankNotification()"
              class="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-1.5"
            >
              <span>⚡</span>
              <span>Dodaj jednym kliknięciem</span>
            </button>

            <button 
              type="button" 
              (click)="state.dismissBankNotification()"
              class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Ignoruj
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class BudgetBankSimulatorComponent {
  readonly state = inject(BudgetStateService);
}
