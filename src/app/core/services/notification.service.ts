import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  durationMs?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  show(toast: Omit<ToastMessage, 'id'>): string {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    const duration = toast.durationMs ?? 4000;
    const newToast: ToastMessage = {
      ...toast,
      id,
      durationMs: duration,
    };

    this._toasts.update((list) => [...list, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  success(title: string, message?: string) {
    return this.show({ type: 'success', title, message });
  }

  error(title: string, message?: string) {
    return this.show({ type: 'error', title, message, durationMs: 6000 });
  }

  warning(title: string, message?: string) {
    return this.show({ type: 'warning', title, message });
  }

  info(title: string, message?: string) {
    return this.show({ type: 'info', title, message });
  }

  dismiss(id: string) {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear() {
    this._toasts.set([]);
  }
}
