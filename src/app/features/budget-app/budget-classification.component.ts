import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { formatWholeZloty } from '../../core/domain/money';
import { BudgetStateService } from '../../core/services/budget-state.service';
import { CLASSIFICATION_META } from './budget-ui.meta';

@Component({
  selector: 'app-budget-classification',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="h-full w-full rounded-3xl bg-[#111827]/90 border border-slate-800/80 p-5 md:p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xl"
    >
      <div class="mb-3">
        <h3 class="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider font-mono">
          KLASYFIKACJA
        </h3>
      </div>

      @if (state.summary().totalMinor === 0) {
        <p class="flex-1 flex items-center text-xs text-slate-500">Brak wydatków w tym miesiącu</p>
      } @else {
        <div class="space-y-3 flex-1 flex flex-col justify-around">
          @for (row of state.breakdown(); track row.classification) {
            <div [attr.data-testid]="'classification-' + row.classification">
              <div class="flex items-center justify-between text-xs mb-1 gap-2">
                <span class="font-medium text-slate-300 flex items-center gap-1.5">
                  {{ meta[row.classification].pluralLabel }}
                  @if (!row.countsTowardLimit) {
                    <span
                      class="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-950/80 text-violet-300 border border-violet-500/40"
                      >poza limitem</span
                    >
                  }
                </span>
                <span class="font-bold text-slate-400 font-mono text-[11px]"
                  >{{ format(row.amountMinor) }} zł · {{ row.percentOfTotal }}%</span
                >
              </div>
              <div class="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  [style.width.%]="row.percentOfTotal"
                  [style.backgroundColor]="meta[row.classification].color"
                ></div>
              </div>
            </div>
          }
        </div>

        <div
          class="mt-3 pt-3 border-t border-slate-800/60 text-xs font-bold text-slate-300 font-mono"
          data-testid="classification-total"
        >
          Razem: {{ format(state.summary().totalMinor) }} zł
        </div>
      }
    </div>
  `,
})
export class BudgetClassificationComponent {
  readonly state = inject(BudgetStateService);
  readonly meta = CLASSIFICATION_META;
  readonly format = formatWholeZloty;
}
