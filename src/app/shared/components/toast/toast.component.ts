import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NotificationService } from "../../../core/services/notification.service";

@Component({
  selector: "app-toast",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div 
          class="pointer-events-auto p-4 rounded-xl shadow-xl border flex items-start gap-3 transition-all duration-300 transform translate-y-0"
          [ngClass]="{
            'bg-emerald-950/90 text-emerald-100 border-emerald-800': toast.type === 'success',
            'bg-rose-950/90 text-rose-100 border-rose-800': toast.type === 'error',
            'bg-amber-950/90 text-amber-100 border-amber-800': toast.type === 'warning',
            'bg-slate-900/90 text-slate-100 border-slate-700': toast.type === 'info'
          }"
        >
          <div class="mt-0.5 shrink-0">
            @if (toast.type === 'success') {
              <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            } @else if (toast.type === 'error') {
              <svg class="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            } @else if (toast.type === 'warning') {
              <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            } @else {
              <svg class="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          </div>

          <div class="flex-1">
            <h4 class="text-sm font-semibold">{{ toast.title }}</h4>
            @if (toast.message) {
              <p class="text-xs opacity-90 mt-0.5">{{ toast.message }}</p>
            }
          </div>

          <button 
            type="button" 
            (click)="notificationService.dismiss(toast.id)"
            class="text-slate-400 hover:text-white transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  readonly notificationService = inject(NotificationService);
}
