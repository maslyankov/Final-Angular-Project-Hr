import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthError } from '../../../models/authErrorModel';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  emailError: string = '';

  signUpForm = new FormGroup(
    {
      email: new FormControl('', [
        Validators.required,
        Validators.pattern(this.emailRegex),
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
      ]),
      confirmPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
      ]),
    },
    { validators: this.passwordsMatchValidator }
  );

  constructor(private authService: AuthService, private router: Router) {}

  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  onSubmit() {
    if (this.signUpForm.valid) {
      const { email, password } = this.signUpForm.value;

      this.authService.signUp(email || '', password || '').subscribe({
        next: () => {
          console.log('User signed up successfully');
          this.emailError = ''; // Clear any existing error
          this.router.navigate(['/']); // Redirect to the home route
        },
        error: (error: AuthError) => {
          console.log(error);
          if (error.code === 'auth/email-already-in-use') {
            this.emailError = 'This email is already used.';
          } else {
            this.emailError = 'An unexpected error occurred. Please try again.';
          }
        },
      });
    }
  }

  hasPasswordMismatch(): boolean {
    return !!(
      this.signUpForm.errors?.['passwordsMismatch'] &&
      this.signUpForm.get('confirmPassword')?.touched
    );
  }
}
