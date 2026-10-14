import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { authGuard, guestGuard } from './auth.guards';
import { AuthService } from './auth.service';

type Mode = 'local' | 'signed-out' | 'signed-in';

async function run(guard: typeof authGuard, mode: Mode): Promise<true | string> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          enabled: mode !== 'local',
          whenReady: vi.fn(() => Promise.resolve()),
          isAuthenticated: () => mode === 'signed-in',
        },
      },
    ],
  });
  const result = await TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
  if (result instanceof UrlTree) {
    return TestBed.inject(Router).serializeUrl(result);
  }
  expect(result).toBe(true);
  return true;
}

describe('authGuard', () => {
  it('passes in local mode', async () => {
    expect(await run(authGuard, 'local')).toBe(true);
  });

  it('redirects to /login without a session', async () => {
    expect(await run(authGuard, 'signed-out')).toBe('/login');
  });

  it('passes with a session', async () => {
    expect(await run(authGuard, 'signed-in')).toBe(true);
  });
});

describe('guestGuard', () => {
  it('redirects to /dashboard in local mode', async () => {
    expect(await run(guestGuard, 'local')).toBe('/dashboard');
  });

  it('passes without a session', async () => {
    expect(await run(guestGuard, 'signed-out')).toBe(true);
  });

  it('redirects to /dashboard with a session', async () => {
    expect(await run(guestGuard, 'signed-in')).toBe('/dashboard');
  });
});
