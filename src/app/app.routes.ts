
import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [

  // Public pages
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home').then(m => m.Home)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/auth/signup/signup').then(m => m.Signup)
  },

  // All logged-in users
  {
    path: 'profile',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'accountant', 'student'] },
    loadComponent: () =>
      import('./features/profile/profile').then(m => m.Profile)
  },

  // Admin and accountant
  {
    path: 'payroll',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'accountant'] },
    loadComponent: () =>
      import('./features/payroll/payroll').then(m => m.Payroll)
  },
  {
    path: 'budget',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'accountant'] },
    loadComponent: () =>
      import('./features/budget/budget').then(m => m.Budget)
  },

  // Admin and student
  {
    path: 'store',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'student'] },
    loadComponent: () =>
      import('./features/store/store').then(m => m.Store)
  },
  {
    path: 'student-fees',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'student'] },
    loadComponent: () =>
      import('./features/student-fees/student-fees').then(m => m.StudentFees)
  },

  // Unknown URL
  {
    path: '**',
    redirectTo: ''
  }
];
