import {
  Component,
  HostListener,
  computed,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          (click)="onBackdropClick()"
        ></div>

        <!-- Modal Box -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl transition-all transform animate-in fade-in zoom-in-95 duration-200"
            [ngClass]="maxWidthClass()"
            (click)="$event.stopPropagation()"
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800"
            >
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ title() }}</h3>
              <button
                type="button"
                (click)="close.emit()"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="mt-4">
              <ng-content></ng-content>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  readonly isOpen = input.required<boolean>();
  readonly title = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly closeOnBackdrop = input<boolean>(true);

  readonly close = output<void>();

  readonly maxWidthClass = computed(() => {
    switch (this.size()) {
      case 'sm':
        return 'max-w-md';
      case 'lg':
        return 'max-w-3xl';
      case 'xl':
        return 'max-w-4xl';
      default:
        return 'max-w-xl';
    }
  });

  onBackdropClick() {
    if (this.closeOnBackdrop()) {
      this.close.emit();
    }
  }

  @HostListener('window:keydown.escape')
  onEsc() {
    if (this.isOpen()) {
      this.close.emit();
    }
  }
}
