import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthError } from '../../../models/authErrorModel';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  emailError: string = '';
  passwordError: string = '';

  logInForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.pattern(this.emailRegex),
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.logInForm.valid) {
      const { email, password } = this.logInForm.value;

      this.authService.signIn(email || '', password || '').subscribe({
        next: () => {
          console.log('User logged in successfully');
          this.emailError = '';
          this.passwordError = '';
          this.router.navigate(['/']); // Redirect to the home route
        },
        error: (error: AuthError) => {
          if (error.code === 'auth/user-not-found') {
            this.emailError = 'No user exists with this email.';
          } else if (error.code === 'auth/invalid-credential') {
            this.passwordError = 'Invalid credentials. Please try again.';
          } else {
            this.emailError = 'Unexpected error.';
          }
        },
      });
    }
  }
}
