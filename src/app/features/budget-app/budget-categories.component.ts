import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { BudgetStateService } from '../../core/services/budget-state.service';

@Component({
  selector: 'app-budget-categories',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="h-full w-full rounded-3xl bg-[#111827]/90 border border-slate-800/80 p-5 md:p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xl"
    >
      <!-- Header -->
      <div class="mb-3">
        <h3 class="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider font-mono">
          KATEGORIE
        </h3>
      </div>

      <!-- Categories Progress Bars List -->
      <div class="space-y-3 flex-1 flex flex-col justify-around">
        @for (cat of state.categoriesBreakdown(); track cat.name) {
          <div>
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="font-medium text-slate-300">{{ cat.name }}</span>
              <span class="font-bold text-slate-400 font-mono text-[11px]"
                >{{ cat.percentage }}%</span
              >
            </div>
            <!-- Progress Bar -->
            <div class="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                [style.width.%]="cat.percentage"
                [style.backgroundColor]="cat.color"
              ></div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class BudgetCategoriesComponent {
  readonly state = inject(BudgetStateService);
}
