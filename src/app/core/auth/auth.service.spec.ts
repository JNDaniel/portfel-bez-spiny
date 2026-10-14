import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { NotificationService } from '../services/notification.service';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { AuthService } from './auth.service';

const session = { user: { email: 'jan@example.test' } };

function setup(enabled = true) {
  let stateCallback: (event: string, session: unknown) => void = () => undefined;
  const fakeClient = {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session }, error: null })),
      onAuthStateChange: vi.fn((cb: typeof stateCallback) => {
        stateCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn((): Promise<{ error: unknown }> => Promise.resolve({ error: null })),
    },
  };
  const getClient = vi.fn(() => Promise.resolve(fakeClient));
  const router = { navigateByUrl: vi.fn(() => Promise.resolve(true)) };
  const notifications = { show: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: SupabaseClientService, useValue: { enabled, getClient } },
      { provide: Router, useValue: router },
      { provide: NotificationService, useValue: notifications },
    ],
  });
  return {
    service: TestBed.inject(AuthService),
    fakeClient,
    getClient,
    router,
    notifications,
    emit: (event: string, value: unknown) => stateCallback(event, value),
  };
}

describe('AuthService', () => {
  it('is ready immediately without touching the client when disabled', async () => {
    const { service, getClient } = setup(false);

    await service.whenReady();

    expect(getClient).not.toHaveBeenCalled();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('restores the session once', async () => {
    const { service, fakeClient } = setup();

    await service.whenReady();
    await service.whenReady();

    expect(fakeClient.auth.getSession).toHaveBeenCalledTimes(1);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userEmail()).toBe('jan@example.test');
  });

  it('retries initialisation after the client failed to load', async () => {
    const { service, fakeClient, getClient } = setup();
    getClient.mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module'));

    await service.whenReady();
    expect(service.isAuthenticated()).toBe(false);

    await service.whenReady();
    expect(getClient).toHaveBeenCalledTimes(2);
    expect(fakeClient.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('signs in and maps sign-in errors', async () => {
    const { service, fakeClient } = setup();
    fakeClient.auth.signInWithPassword
      .mockResolvedValueOnce({ data: { session }, error: null })
      .mockResolvedValueOnce({ data: { session: null }, error: { code: 'invalid_credentials' } });

    expect(await service.signIn('jan@example.test', 'haslo1')).toEqual({ ok: true });
    expect(service.isAuthenticated()).toBe(true);
    expect(await service.signIn('jan@example.test', 'zle')).toEqual({
      ok: false,
      message: 'Nieprawidłowy email lub hasło.',
    });
  });

  it('reports whether sign-up returned a session', async () => {
    const { service, fakeClient } = setup();
    fakeClient.auth.signUp
      .mockResolvedValueOnce({ data: { session, user: session.user }, error: null })
      .mockResolvedValueOnce({ data: { session: null, user: session.user }, error: null });

    expect(await service.signUp('jan@example.test', 'haslo1')).toEqual({ status: 'signed-in' });
    expect(await service.signUp('jan@example.test', 'haslo1')).toEqual({
      status: 'confirmation-required',
    });
  });

  it('reports an existing account hidden behind a user without identities', async () => {
    const { service, fakeClient } = setup();
    fakeClient.auth.signUp.mockResolvedValueOnce({
      data: { session: null, user: { ...session.user, identities: [] } },
      error: null,
    });

    expect(await service.signUp('jan@example.test', 'haslo1')).toEqual({
      status: 'error',
      message: 'Konto z tym adresem już istnieje.',
    });
  });

  it('treats an unrequested SIGNED_OUT as an expired session', async () => {
    const { service, router, notifications, emit } = setup();
    await service.whenReady();

    emit('SIGNED_OUT', null);

    expect(service.isAuthenticated()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'warning', title: 'Wylogowano' }),
    );
  });

  it('navigates without a toast after signOut()', async () => {
    const { service, router, notifications, emit } = setup();
    await service.whenReady();

    await service.signOut();
    emit('SIGNED_OUT', null);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(notifications.show).not.toHaveBeenCalled();
  });

  it('shows no error toast when signOut() fails after clearing the session', async () => {
    const { service, fakeClient, notifications, emit } = setup();
    await service.whenReady();
    fakeClient.auth.signOut.mockImplementationOnce(() => {
      emit('SIGNED_OUT', null);
      return Promise.resolve({ error: { status: 500 } });
    });

    await service.signOut();

    expect(service.isAuthenticated()).toBe(false);
    expect(notifications.show).not.toHaveBeenCalled();
  });

  it('shows an error toast when signOut() fails and the session remains', async () => {
    const { service, fakeClient, router, notifications } = setup();
    await service.whenReady();
    fakeClient.auth.signOut.mockResolvedValueOnce({ error: { status: 500 } });

    await service.signOut();

    expect(service.isAuthenticated()).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', title: 'Nie udało się wylogować' }),
    );
  });
});
