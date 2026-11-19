
import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole } from '../models/user.model';
import { Storage } from './storage';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private currentUserSignal = signal<User | null>(null);

  currentUser = this.currentUserSignal.asReadonly();

  isLoggedIn = computed(() => this.currentUserSignal() !== null);

  // Demo accounts for Milestone 1
  private demoAccounts = [
    {
      username: 'admin',
      password: 'Admin123',
      user: {
        id: 1,
        username: 'admin',
        fullName: 'CampusCart Admin',
        email: 'admin@campuscart.com',
        pictureUrl: '',
        role: 'admin' as UserRole,
        preferences: []
      }
    },
    {
      username: 'accountant',
      password: 'Account123',
      user: {
        id: 2,
        username: 'accountant',
        fullName: 'CampusCart Accountant',
        email: 'accountant@campuscart.com',
        pictureUrl: '',
        role: 'accountant' as UserRole,
        preferences: []
      }
    },
    {
      username: 'student',
      password: 'Student123',
      user: {
        id: 3,
        username: 'student',
        fullName: 'CampusCart Student',
        email: 'student@campuscart.com',
        pictureUrl: '',
        role: 'student' as UserRole,
        preferences: []
      }
    }
  ];

  // Registered accounts
  private registeredAccounts: {
    username: string;
    password: string;
    user: User;
  }[] = [];

  private nextUserId = 4;

  constructor(private storage: Storage) {

    // Load registered accounts from localStorage
    this.registeredAccounts =
      this.storage.getLocal<typeof this.registeredAccounts>(
        'campusCartRegisteredAccounts'
      ) ?? [];

    // Restore the next available user ID
    if (this.registeredAccounts.length > 0) {
      const highestId = Math.max(
        ...this.registeredAccounts.map(account => account.user.id)
      );

      this.nextUserId = Math.max(4, highestId + 1);
    }

    // Restore the previous session
    const savedUser = this.storage.getSession<User>('campusCartUser');

    if (savedUser) {
      this.currentUserSignal.set(savedUser);
    }
  }

  // LOGIN
  login(username: string, password: string): boolean {

    const account = [
      ...this.demoAccounts,
      ...this.registeredAccounts
    ].find(
      account =>
        account.username === username &&
        account.password === password
    );

    if (!account) {
      return false;
    }

    this.startSession(account.user);
    return true;
  }

  // SIGNUP
  register(
    userData: Omit<User, 'id'>,
    password: string
  ): boolean {

    const usernameExists = [
      ...this.demoAccounts,
      ...this.registeredAccounts
    ].some(account =>
      account.username === userData.username ||
      account.user.email === userData.email
    );

    if (usernameExists || !password.trim()) {
      return false;
    }

    const newUser: User = {
      id: this.nextUserId++,
      ...userData
    };

    this.registeredAccounts.push({
      username: userData.username,
      password: password,
      user: newUser
    });

    // Save registered accounts permanently in localStorage
    this.storage.setLocal(
      'campusCartRegisteredAccounts',
      this.registeredAccounts
    );

    this.startSession(newUser);
    return true;
  }

  // START SESSION
  private startSession(user: User): void {
    this.currentUserSignal.set(user);

    this.storage.setSession('campusCartUser', user);
  }

  // LOGOUT
  logout(): void {
    this.currentUserSignal.set(null);

    this.storage.removeSession('campusCartUser');
  }

  // CHECK USER ROLE
  hasRole(roles: UserRole | UserRole[]): boolean {

    const user = this.currentUserSignal();

    if (!user) {
      return false;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return allowedRoles.includes(user.role);
  }
}
