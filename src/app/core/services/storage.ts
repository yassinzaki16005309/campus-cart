
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Storage {

  // LOCAL STORAGE
  setLocal<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  getLocal<T>(key: string): T | null {
    const data = localStorage.getItem(key);

    if (data === null) {
      return null;
    }

    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  removeLocal(key: string): void {
    localStorage.removeItem(key);
  }


  // SESSION STORAGE
  setSession<T>(key: string, value: T): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  getSession<T>(key: string): T | null {
    const data = sessionStorage.getItem(key);

    if (data === null) {
      return null;
    }

    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  removeSession(key: string): void {
    sessionStorage.removeItem(key);
  }


  // COOKIES
  setCookie(
    name: string,
    value: string,
    days: number
  ): void {
    const maxAge = days * 24 * 60 * 60;

    document.cookie =
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ` +
      `max-age=${maxAge}; path=/; SameSite=Lax`;
  }

  getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      const [key, ...valueParts] = cookie.trim().split('=');

      if (key === encodeURIComponent(name)) {
        return decodeURIComponent(valueParts.join('='));
      }
    }

    return null;
  }

  deleteCookie(name: string): void {
    document.cookie =
      `${encodeURIComponent(name)}=; max-age=0; path=/; SameSite=Lax`;
  }
}
