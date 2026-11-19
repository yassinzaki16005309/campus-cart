
import { TestBed } from '@angular/core/testing';
import { Auth } from './auth';
import { Storage } from './storage';
import { User, UserRole } from '../models/user.model';

describe('Auth', () => {
  let service: Auth;
  let storageMock: jasmine.SpyObj<Storage>;

  const registrationData: Omit<User, 'id'> = {
    username: 'newstudent',
    fullName: 'New Student',
    email: 'newstudent@example.com',
    pictureUrl: '',
    role: 'student',
    preferences: []
  };

  beforeEach(() => {
    storageMock = jasmine.createSpyObj('Storage', [
      'getLocal',
      'getSession',
      'setLocal',
      'setSession',
      'removeSession'
    ]);

    storageMock.getLocal.and.returnValue([]);
    storageMock.getSession.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        { provide: Storage, useValue: storageMock }
      ]
    });
  });

  function getService(): Auth {
    service = TestBed.inject(Auth);
    return service;
  }

  // SERVICE CREATION
  it('should be created', () => {
    expect(getService()).toBeTruthy();
  });

  // LOGIN
  it('should login successfully with valid admin credentials', () => {
    const auth = getService();

    const result = auth.login('admin', 'Admin123');

    expect(result).toBeTrue();
    expect(auth.isLoggedIn()).toBeTrue();
    expect(auth.currentUser()?.role).toBe('admin');
    expect(storageMock.setSession).toHaveBeenCalled();
  });

  it('should login successfully with accountant credentials', () => {
    const auth = getService();

    expect(auth.login('accountant', 'Account123')).toBeTrue();
    expect(auth.currentUser()?.role).toBe('accountant');
  });

  it('should login successfully with student credentials', () => {
    const auth = getService();

    expect(auth.login('student', 'Student123')).toBeTrue();
    expect(auth.currentUser()?.role).toBe('student');
  });

  it('should reject invalid login credentials', () => {
    const auth = getService();

    expect(auth.login('admin', 'WrongPassword')).toBeFalse();
    expect(auth.isLoggedIn()).toBeFalse();
    expect(storageMock.setSession).not.toHaveBeenCalled();
  });

  // LOGOUT
  it('should logout and remove the saved session', () => {
    const auth = getService();

    auth.login('admin', 'Admin123');
    auth.logout();

    expect(auth.isLoggedIn()).toBeFalse();
    expect(auth.currentUser()).toBeNull();
    expect(storageMock.removeSession)
      .toHaveBeenCalledWith('campusCartUser');
  });

  // REGISTRATION
  it('should register a new user and save the account', () => {
    const auth = getService();

    const result = auth.register(registrationData, 'Password123');

    expect(result).toBeTrue();
    expect(auth.isLoggedIn()).toBeTrue();
    expect(auth.currentUser()?.username).toBe('newstudent');
    expect(auth.currentUser()?.id).toBe(4);
    expect(storageMock.setLocal).toHaveBeenCalled();
    expect(storageMock.setSession).toHaveBeenCalled();
  });

  it('should reject registration with an existing username', () => {
    const auth = getService();

    auth.register(registrationData, 'Password123');

    const duplicate = auth.register(
      { ...registrationData, email: 'another@example.com' },
      'Password456'
    );

    expect(duplicate).toBeFalse();
  });

 it('should reject registration with an existing email', () => {
  const auth = getService();

  auth.register(registrationData, 'Password123');

  const duplicate = auth.register(
    { ...registrationData, username: 'anotheruser' },
    'Password456'
  );

  expect(duplicate).toBeFalse();
});

  it('should reject registration with an empty password', () => {
    const auth = getService();

    expect(auth.register(registrationData, '   ')).toBeFalse();
    expect(auth.isLoggedIn()).toBeFalse();
  });

  it('should allow a newly registered user to login later', () => {
    const auth = getService();

    auth.register(registrationData, 'Password123');
    auth.logout();

    expect(auth.login('newstudent', 'Password123')).toBeTrue();
    expect(auth.currentUser()?.username).toBe('newstudent');
  });

  // SESSION RESTORATION
  it('should restore the previously saved session', () => {
    const savedUser: User = {
      id: 1,
      username: 'admin',
      fullName: 'CampusCart Admin',
      email: 'admin@campuscart.com',
      pictureUrl: '',
      role: 'admin',
      preferences: []
    };

    storageMock.getSession.and.returnValue(savedUser);

    const auth = getService();

    expect(auth.isLoggedIn()).toBeTrue();
    expect(auth.currentUser()).toEqual(savedUser);
  });

  // ROLE CHECKING
  it('should allow access when the user has the required role', () => {
    const auth = getService();

    auth.login('admin', 'Admin123');

    expect(auth.hasRole('admin')).toBeTrue();
  });

  it('should allow access when the user has one of the allowed roles', () => {
    const auth = getService();

    auth.login('accountant', 'Account123');

    expect(auth.hasRole(['admin', 'accountant'])).toBeTrue();
  });

  it('should deny access when the user does not have the required role', () => {
    const auth = getService();

    auth.login('student', 'Student123');

    expect(auth.hasRole('admin')).toBeFalse();
  });

  it('should deny access when nobody is logged in', () => {
    const auth = getService();

    expect(auth.hasRole('admin')).toBeFalse();
  });
});
