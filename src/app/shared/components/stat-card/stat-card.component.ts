import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-stat-card",
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card p-5 relative overflow-hidden group hover:border-brand-500/40 transition-all duration-300">
      <!-- Background subtle gradient glow -->
      <div 
        class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 blur-xl transition-all group-hover:opacity-25"
        [style.backgroundColor]="accentColor()"
      ></div>

      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ label() }}</span>
        <div 
          class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold transition-transform group-hover:scale-110"
          [style.backgroundColor]="iconBgColor()"
          [style.color]="accentColor()"
        >
          <ng-content select="[icon]"></ng-content>
        </div>
      </div>

      <div class="flex items-baseline gap-2">
        <h3 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{{ value() }}</h3>
        @if (subValue()) {
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">{{ subValue() }}</span>
        }
      </div>

      @if (badgeText()) {
        <div class="mt-3 flex items-center gap-1.5 text-xs font-semibold">
          <span 
            class="px-2 py-0.5 rounded-full inline-flex items-center gap-1"
            [ngClass]="{
              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20': badgeType() === 'positive',
              'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20': badgeType() === 'negative',
              'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20': badgeType() === 'warning',
              'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20': badgeType() === 'neutral'
            }"
          >
            {{ badgeText() }}
          </span>
          @if (badgeDescription()) {
            <span class="text-[11px] text-slate-400">{{ badgeDescription() }}</span>
          }
        </div>
      }
    </div>
  `
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly subValue = input<string>();
  readonly accentColor = input<string>("#0284c7");
  readonly iconBgColor = input<string>("rgba(2, 132, 199, 0.1)");
  readonly badgeText = input<string>();
  readonly badgeType = input<"positive" | "negative" | "warning" | "neutral">("neutral");
  readonly badgeDescription = input<string>();
}
