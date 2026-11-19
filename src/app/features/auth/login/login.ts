import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Storage } from '../../../core/services/storage';

// Cookie that remembers the last username (small, non-sensitive, survives
// browser restarts and could be read by a server in a real deployment)
export const REMEMBER_COOKIE = 'campusCartRememberedUsername';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  username = '';
  password = '';
  rememberMe = false;
  errorMessage = '';

  constructor(
    private auth: Auth,
    private router: Router,
    private storage: Storage
  ) {
    // Pre-fill the username if the user chose "Remember me" before
    const remembered = this.storage.getCookie(REMEMBER_COOKIE);

    if (remembered) {
      this.username = remembered;
      this.rememberMe = true;
    }
  }

  login(): void {

    const success = this.auth.login(this.username, this.password);

    if (success) {
      // Cookie: only the username is stored, never the password
      if (this.rememberMe) {
        this.storage.setCookie(REMEMBER_COOKIE, this.username, 30);
      } else {
        this.storage.deleteCookie(REMEMBER_COOKIE);
      }

      this.router.navigate(['/profile']);
    } else {
      this.errorMessage = 'Invalid username or password.';
    }
  }
}
