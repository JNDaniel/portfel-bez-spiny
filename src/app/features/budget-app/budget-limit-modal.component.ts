import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { parseAmountToMinor } from '../../core/domain/money';
import { BudgetStateService } from '../../core/services/budget-state.service';

@Component({
  selector: 'app-budget-limit-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (state.isLimitModalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="budget-limit-modal-title"
          class="relative w-full max-w-sm rounded-3xl bg-[#111827] border border-slate-800 p-6 shadow-2xl space-y-4"
        >
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 id="budget-limit-modal-title" class="text-base font-bold text-white">
              Miesięczny limit
            </h3>
            <button
              type="button"
              (click)="state.isLimitModalOpen.set(false)"
              aria-label="Zamknij"
              class="text-slate-400 hover:text-white text-sm p-1"
            >
              ✕
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4 text-xs">
            <div>
              <label for="budget-limit-amount" class="block text-slate-400 font-semibold mb-1"
                >Limit (zł) *</label
              >
              <input
                id="budget-limit-amount"
                type="number"
                step="0.01"
                min="1"
                formControlName="amount"
                placeholder="np. 4000"
                class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-white outline-none focus:border-emerald-500 font-mono text-sm"
              />
              <p class="mt-1.5 text-[11px] text-slate-500">
                Obowiązuje od {{ state.currentMonthLabel() }} do kolejnej zmiany.
              </p>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="state.isLimitModalOpen.set(false)"
                class="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold"
              >
                Anuluj
              </button>
              <button
                type="submit"
                [disabled]="form.invalid"
                class="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition"
              >
                Zapisz limit
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class BudgetLimitModalComponent {
  private readonly fb = inject(FormBuilder);
  readonly state = inject(BudgetStateService);

  readonly form: FormGroup = this.fb.group({
    amount: [null, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    effect(() => {
      if (!this.state.isLimitModalOpen()) return;
      const current = this.state.limitMinor();
      this.form.reset({ amount: current === null ? null : current / 100 });
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    const minor = parseAmountToMinor(this.form.value.amount);
    if (minor === null || minor <= 0) return;
    void this.state.setMonthlyLimit(minor);
  }
}
