import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4">
      <div
        class="w-full max-w-sm rounded-3xl bg-[#111827] border border-slate-800 p-6 shadow-2xl space-y-4"
      >
        @if (confirmationEmail(); as sentTo) {
          <div data-testid="auth-confirmation" class="space-y-3 text-xs">
            <h1 class="text-base font-bold text-white">Sprawdź skrzynkę</h1>
            <p class="text-slate-400">
              Wysłaliśmy link potwierdzający na adres {{ sentTo }}. Po kliknięciu linku wrócisz do
              aplikacji.
            </p>
            <a
              routerLink="/login"
              class="block text-center text-emerald-400 hover:text-emerald-300 font-semibold"
              >Przejdź do logowania</a
            >
          </div>
        } @else {
          <div class="pb-3 border-b border-slate-800">
            <h1 class="text-base font-bold text-white">Załóż konto</h1>
            <p class="text-[11px] text-slate-500">Portfel Bez Spiny</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4 text-xs">
            <div>
              <label for="auth-email" class="block text-slate-400 font-semibold mb-1">Email</label>
              <input
                id="auth-email"
                type="email"
                autocomplete="email"
                formControlName="email"
                class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-white outline-none focus:border-emerald-500 text-sm"
              />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="mt-1.5 text-[11px] text-rose-400">Podaj poprawny adres email.</p>
              }
            </div>

            <div>
              <label for="auth-password" class="block text-slate-400 font-semibold mb-1"
                >Hasło</label
              >
              <input
                id="auth-password"
                type="password"
                autocomplete="new-password"
                formControlName="password"
                class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-white outline-none focus:border-emerald-500 text-sm"
              />
              <p
                class="mt-1.5 text-[11px]"
                [class.text-rose-400]="
                  form.get('password')?.invalid && form.get('password')?.touched
                "
                [class.text-slate-500]="
                  !(form.get('password')?.invalid && form.get('password')?.touched)
                "
              >
                Co najmniej 6 znaków.
              </p>
            </div>

            @if (error(); as message) {
              <p role="alert" data-testid="auth-error" class="text-rose-400 font-semibold">
                {{ message }}
              </p>
            }

            <button
              type="submit"
              [disabled]="form.invalid || pending()"
              class="w-full px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition"
            >
              {{ pending() ? 'Zakładanie konta…' : 'Załóż konto' }}
            </button>

            <a
              routerLink="/login"
              class="block text-center text-slate-400 hover:text-white font-semibold"
              >Masz już konto? Zaloguj się</a
            >
          </form>
        }
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly confirmationEmail = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit() {
    if (this.form.invalid || this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    const { email, password } = this.form.value;
    let result: Awaited<ReturnType<AuthService['signUp']>>;
    try {
      result = await this.auth.signUp(email, password);
    } finally {
      this.pending.set(false);
    }
    switch (result.status) {
      case 'signed-in':
        await this.router.navigateByUrl('/dashboard');
        break;
      case 'confirmation-required':
        this.confirmationEmail.set(email);
        break;
      case 'error':
        this.error.set(result.message);
        break;
    }
  }
}
