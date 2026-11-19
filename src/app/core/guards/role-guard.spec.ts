
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';

import { roleGuard } from './role-guard';
import { Auth } from '../services/auth';
import { Storage } from '../services/storage';

describe('roleGuard', () => {
  let auth: Auth;
  let router: Router;
  let storageMock: jasmine.SpyObj<Storage>;

  const executeGuard = (roles: string[]): boolean | UrlTree => {
    const route = new ActivatedRouteSnapshot();
    route.data = { roles };

const state = {
  url: '/payroll'
} as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() =>
      roleGuard(route, state)
    ) as boolean | UrlTree;
  };

  beforeEach(() => {
    storageMock = jasmine.createSpyObj<Storage>('Storage', [
      'getLocal',
      'setLocal',
      'getSession',
      'setSession',
      'removeSession'
    ]);

    storageMock.getLocal.and.returnValue(null);
    storageMock.getSession.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        { provide: Storage, useValue: storageMock }
      ]
    });

    auth = TestBed.inject(Auth);
    router = TestBed.inject(Router);
  });

  it('should allow an admin to access admin pages', () => {
    auth.login('admin', 'Admin123');
    expect(executeGuard(['admin', 'accountant'])).toBeTrue();
  });

  it('should allow an accountant to access permitted pages', () => {
    auth.login('accountant', 'Account123');
    expect(executeGuard(['admin', 'accountant'])).toBeTrue();
  });

  it('should allow a student to access student pages', () => {
    auth.login('student', 'Student123');
    expect(executeGuard(['student'])).toBeTrue();
  });

  it('should redirect logged-out users to login', () => {
    const result = executeGuard(['admin', 'accountant']);

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('should prevent students from accessing admin pages', () => {
    auth.login('student', 'Student123');

    const result = executeGuard(['admin', 'accountant']);

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });

  it('should prevent accountants from accessing student-only pages', () => {
    auth.login('accountant', 'Account123');

    const result = executeGuard(['student']);

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });

  it('should prevent students from accessing admin-only pages', () => {
    auth.login('student', 'Student123');

    const result = executeGuard(['admin']);

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });
});
