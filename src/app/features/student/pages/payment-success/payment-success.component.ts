import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ButtonComponent],
  template: `
    <div class="min-h-screen bg-slate-50">
      <app-header pageTitle="Payment" [isDark]="true"></app-header>

      <div class="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
        <div class="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-slate-100">
          <div class="h-24 w-24 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-6">
            <i class="fa-solid fa-check text-4xl text-green-600"></i>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
          <p class="text-slate-600 mb-8">You've been enrolled in the course. Head back to your dashboard to start learning.</p>

          <app-button [variant]="'primary'" [size]="'lg'" [fullWidth]="true"
            customColor="bg-slate-900 text-white hover:bg-slate-800"
            (buttonClick)="goToDashboard()">
            Go to Dashboard
          </app-button>
        </div>
      </div>
    </div>
  `,
})
export class PaymentSuccessComponent {
  constructor(private router: Router) {}

  goToDashboard() {
    this.router.navigate(['/student/dashboard']);
  }
}
