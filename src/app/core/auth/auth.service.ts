import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { NotificationService } from '../services/notification.service';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { authErrorMessage } from './auth-errors';

export type SignInResult = { ok: true } | { ok: false; message: string };
export type SignUpResult =
  | { status: 'signed-in' }
  | { status: 'confirmation-required' }
  | { status: 'error'; message: string };

/** The only place that talks to `supabase.auth`. Components and guards use this service. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  private readonly _session = signal<Session | null>(null);
  private readyPromise: Promise<void> | null = null;
  private signingOut = false;

  readonly enabled = this.supabase.enabled;
  readonly session = this._session.asReadonly();
  readonly userId = computed(() => this._session()?.user.id ?? null);
  readonly userEmail = computed(() => this._session()?.user.email ?? null);
  readonly isAuthenticated = computed(() => this._session() !== null);

  whenReady(): Promise<void> {
    this.readyPromise ??= this.init();
    return this.readyPromise;
  }

  async signIn(email: string, password: string): Promise<SignInResult> {
    try {
      const client = await this.supabase.getClient();
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        return { ok: false, message: authErrorMessage(error) };
      }
      this._session.set(data.session);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: authErrorMessage(error) };
    }
  }

  async signUp(email: string, password: string): Promise<SignUpResult> {
    try {
      const client = await this.supabase.getClient();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        return { status: 'error', message: authErrorMessage(error) };
      }
      if (data.session) {
        this._session.set(data.session);
        return { status: 'signed-in' };
      }
      // With email confirmation on, Supabase hides an existing account behind a user
      // without identities instead of an error; the product wants to say so explicitly.
      if (data.user?.identities?.length === 0) {
        return { status: 'error', message: authErrorMessage({ code: 'user_already_exists' }) };
      }
      return { status: 'confirmation-required' };
    } catch (error) {
      return { status: 'error', message: authErrorMessage(error) };
    }
  }

  async signOut(): Promise<void> {
    this.signingOut = true;
    try {
      const client = await this.supabase.getClient();
      const { error } = await client.auth.signOut();
      if (error) {
        throw error;
      }
    } catch {
      this.signingOut = false;
      // supabase-js clears the local session (and emits SIGNED_OUT) even when the server call fails.
      if (this._session() !== null) {
        this.notifications.show({ type: 'error', title: 'Nie udało się wylogować' });
      }
    }
  }

  private async init(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    try {
      const client = await this.supabase.getClient();
      const { data } = await client.auth.getSession();
      this._session.set(data.session);
      client.auth.onAuthStateChange((event, session) => this.onAuthStateChange(event, session));
    } catch {
      this._session.set(null);
      // Let the next guard run retry instead of caching the failure until a reload.
      this.readyPromise = null;
    }
  }

  // Keep this callback quick and synchronous; it runs on every auth event across tabs.
  private onAuthStateChange(event: AuthChangeEvent, session: Session | null): void {
    this._session.set(session);
    if (event === 'SIGNED_OUT') {
      void this.router.navigateByUrl('/login');
      if (!this.signingOut) {
        this.notifications.show({
          type: 'warning',
          title: 'Wylogowano',
          message: 'Zaloguj się ponownie.',
        });
      }
      this.signingOut = false;
    }
  }
}
