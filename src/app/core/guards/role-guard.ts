
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route, state) => {

  const auth = inject(Auth);
  const router = inject(Router);

  // Check which roles are allowed for this page
  const allowedRoles = route.data['roles'] as UserRole[];

  // If nobody is logged in, redirect to login
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  // If the user doesn't have the required role, redirect home
  if (!auth.hasRole(allowedRoles)) {
    return router.createUrlTree(['/']);
  }

  // Allow navigation
  return true;
};
