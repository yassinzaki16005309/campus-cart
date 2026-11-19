
import { TestBed } from '@angular/core/testing';
import { Storage } from './storage';

describe('Storage', () => {
  let service: Storage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Storage);

    localStorage.clear();
    sessionStorage.clear();

    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; max-age=0; path=/`;
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // LOCAL STORAGE
  it('should save and retrieve data from localStorage', () => {
    const user = { username: 'student', role: 'student' };

    service.setLocal('user', user);

    expect(service.getLocal('user')).toEqual(user);
  });

  it('should return null for a missing localStorage key', () => {
    expect(service.getLocal('missing')).toBeNull();
  });

  it('should return null for invalid localStorage JSON', () => {
    localStorage.setItem('invalid', '{invalid json');

    expect(service.getLocal('invalid')).toBeNull();
  });

  it('should remove data from localStorage', () => {
    service.setLocal('user', { username: 'student' });

    service.removeLocal('user');

    expect(service.getLocal('user')).toBeNull();
  });

  // SESSION STORAGE
  it('should save and retrieve data from sessionStorage', () => {
    const user = { username: 'admin', role: 'admin' };

    service.setSession('currentUser', user);

    expect(service.getSession('currentUser')).toEqual(user);
  });

  it('should return null for a missing sessionStorage key', () => {
    expect(service.getSession('missing')).toBeNull();
  });

  it('should return null for invalid sessionStorage JSON', () => {
    sessionStorage.setItem('invalid', '{invalid json');

    expect(service.getSession('invalid')).toBeNull();
  });

  it('should remove data from sessionStorage', () => {
    service.setSession('currentUser', { username: 'admin' });

    service.removeSession('currentUser');

    expect(service.getSession('currentUser')).toBeNull();
  });

  // COOKIES
  it('should save and retrieve a cookie', () => {
    service.setCookie('theme', 'dark', 7);

    expect(service.getCookie('theme')).toBe('dark');
  });

  it('should return null for a missing cookie', () => {
    expect(service.getCookie('missing')).toBeNull();
  });

  it('should encode cookie names and values', () => {
    service.setCookie('user name', 'student@example.com', 7);

    expect(service.getCookie('user name')).toBe('student@example.com');
  });

  it('should delete a cookie', () => {
    service.setCookie('theme', 'dark', 7);

    service.deleteCookie('theme');

    expect(service.getCookie('theme')).toBeNull();
  });
});
