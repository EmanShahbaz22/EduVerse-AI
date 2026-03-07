import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-student-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, NgIf, RouterLink],
  templateUrl: './student-signup.component.html',
  styleUrls: ['./student-signup.component.css'],
})
export class StudentSignupComponent {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  contactNo = '';
  country = '';
  status = 'studying';

  errorMessage = '';
  loading = false;

  constructor(private router: Router, private authService: AuthService) { }

  validateForm(): boolean {
    this.errorMessage = '';

    if (!this.fullName.trim()) return this.fail('Full name is required.');
    if (!this.email.trim()) return this.fail('Email is required.');
    if (!this.validateEmail(this.email))
      return this.fail('Invalid email format.');
    if (!this.password.trim()) return this.fail('Password is required.');
    if (this.password.length < 6)
      return this.fail('Password must be at least 6 characters.');
    if (this.password !== this.confirmPassword)
      return this.fail('Passwords do not match.');
    if (!this.contactNo.trim()) return this.fail('Contact number is required.');
    if (!this.country.trim()) return this.fail('Country is required.');
    if (!this.status.trim()) return this.fail('Status is required.');

    return true;
  }

  fail(msg: string): false {
    this.errorMessage = msg;
    return false;
  }

  validateEmail(email: string): boolean {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  onSignup() {
    if (this.loading) return;
    if (!this.validateForm()) return;

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      contactNo: this.contactNo,
      country: this.country,
      status: this.status,
      role: 'student',
    };

    this.authService.signup(payload, 'student').subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          getApiErrorMessage(err, 'Signup failed. Please try again.');
      },
    });
  }
}
