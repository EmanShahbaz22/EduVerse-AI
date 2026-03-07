import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-admin-signup',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './admin-signup.component.html',
  styleUrls: ['./admin-signup.component.css'],
})
export class AdminSignupComponent {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  contactNo = '';
  country = '';
  status = 'active';
  profileImageURL = '';
  tenantName = '';
  tenantLogoUrl = '';

  errorMessage = '';
  loading = false;

  constructor(private router: Router, private authService: AuthService) {}

  private normalizeOptionalValue(value: string): string | undefined {
    const trimmed = (value || '').trim();
    return trimmed ? trimmed : undefined;
  }

  onSignup() {
    if (this.loading) return;
    if (!this.validateForm()) return;
    this.loading = true;
    this.errorMessage = '';

    const payload = {
      fullName: this.fullName.trim(),
      email: this.email.trim().toLowerCase(),
      password: this.password,
      contactNo: this.contactNo.trim(),
      country: this.country.trim(),
      status: this.status,
      role: 'admin',
      profileImageURL: this.normalizeOptionalValue(this.profileImageURL),
      tenantName: this.tenantName.trim(),
      tenantLogoUrl: this.normalizeOptionalValue(this.tenantLogoUrl),
    };

    this.authService.signup(payload, 'admin').subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 400 || err?.status === 422) {
          this.errorMessage = getApiErrorMessage(
            err,
            'Please check your organization details and try again.',
          );
          return;
        }
        this.errorMessage = getApiErrorMessage(
          err,
          'Unable to create your organization account right now. Please try again.',
        );
      },
    });
  }

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
    if (!this.tenantName.trim()) return this.fail('Tenant name is required.');

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

}
