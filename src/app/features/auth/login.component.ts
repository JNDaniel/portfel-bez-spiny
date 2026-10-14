import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4">
      <div
        class="w-full max-w-sm rounded-3xl bg-[#111827] border border-slate-800 p-6 shadow-2xl space-y-4"
      >
        <div class="pb-3 border-b border-slate-800">
          <h1 class="text-base font-bold text-white">Zaloguj się</h1>
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
            <label for="auth-password" class="block text-slate-400 font-semibold mb-1">Hasło</label>
            <input
              id="auth-password"
              type="password"
              autocomplete="current-password"
              formControlName="password"
              class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-white outline-none focus:border-emerald-500 text-sm"
            />
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
            {{ pending() ? 'Logowanie…' : 'Zaloguj się' }}
          </button>

          <a
            routerLink="/register"
            class="block text-center text-slate-400 hover:text-white font-semibold"
            >Nie masz konta? Załóż konto</a
          >
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  async onSubmit() {
    if (this.form.invalid || this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    const { email, password } = this.form.value;
    let result: Awaited<ReturnType<AuthService['signIn']>>;
    try {
      result = await this.auth.signIn(email, password);
    } finally {
      this.pending.set(false);
    }
    if (result.ok) {
      await this.router.navigateByUrl('/dashboard');
    } else {
      this.error.set(result.message);
    }
  }
}
