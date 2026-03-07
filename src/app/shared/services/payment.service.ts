import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENDPOINTS } from '../../core/constants/api.constants';

export interface PaymentRecord {
  id: string;
  courseId: string;
  studentId: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: string;
  stripeSessionId?: string;
  createdAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  constructor(private http: HttpClient) {}

  /**
   * Get Stripe publishable key from backend.
   */
  getStripeConfig(): Observable<{ publishableKey: string }> {
    return this.http.get<{ publishableKey: string }>(ENDPOINTS.PAYMENTS.CONFIG);
  }

  /**
   * Create a PaymentIntent and get the client secret for Stripe Elements.
   */
  createPaymentIntent(
    courseId: string,
    tenantId?: string
  ): Observable<{ clientSecret: string }> {
    const payload: { courseId: string; tenantId?: string } = { courseId };
    if (tenantId) payload.tenantId = tenantId;
    return this.http.post<{ clientSecret: string }>(
      ENDPOINTS.PAYMENTS.CREATE_INTENT,
      payload,
    );
  }

  /**
   * Confirm payment after successful card charge (triggers enrollment).
   */
  confirmPayment(paymentIntentId: string): Observable<{ status: string; courseId: string }> {
    return this.http.post<{ status: string; courseId: string }>(
      ENDPOINTS.PAYMENTS.CONFIRM(paymentIntentId),
      {},
    );
  }

  /**
   * Get all payments for the current student.
   */
  getMyPayments(): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(ENDPOINTS.PAYMENTS.MY_PAYMENTS);
  }
}
