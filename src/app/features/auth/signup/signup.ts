import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {

  username = '';
  fullName = '';
  email = '';
  pictureUrl = '';
  password = '';
  creditCard = '';
  preferences: string[] = [];

  errorMessage = '';

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  togglePreference(preference: string): void {
    if (this.preferences.includes(preference)) {
      this.preferences = this.preferences.filter(
        item => item !== preference
      );
    } else {
      this.preferences.push(preference);
    }
  }

  signup(): void {

    const success = this.auth.register(
      {
        username: this.username,
        fullName: this.fullName,
        email: this.email,
        pictureUrl: this.pictureUrl,
        role: 'student',
        preferences: this.preferences
      },
      this.password
    );

    if (success) {
      this.router.navigate(['/profile']);
    } else {
      this.errorMessage = 'Username or email already exists, or password is invalid.';
    }
  }
}