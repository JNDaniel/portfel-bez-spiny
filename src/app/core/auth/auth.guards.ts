import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Protects the dashboard. Passes in local mode, where there is no authentication. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.enabled) {
    return true;
  }
  await auth.whenReady();
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

/** Keeps signed-in users (and local mode) away from the login and register screens. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.enabled) {
    return router.createUrlTree(['/dashboard']);
  }
  await auth.whenReady();
  return auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
