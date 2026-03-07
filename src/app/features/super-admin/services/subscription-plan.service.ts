import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type PlanBillingCycle = 'monthly' | 'quarterly' | 'yearly';
export type PlanStatus = 'active' | 'inactive';

export interface SubscriptionPlanPayload {
  code: string;
  name: string;
  category: string;
  billingCycle: PlanBillingCycle;
  pricePerMonth: number;
  maxStudents?: number | null;
  maxTeachers?: number | null;
  maxCourses?: number | null;
  aiCredits?: number | null;
  storageGb?: number | null;
  description?: string | null;
  features: string[];
  status: PlanStatus;
}

export interface SubscriptionPlan extends SubscriptionPlanPayload {
  id: string;
  createdAt: string;
  updatedAt?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionPlanService {
  private readonly API_URL = `${environment.apiUrl}/subscription-plans`;

  constructor(private http: HttpClient) {}

  getPlans(status?: PlanStatus): Observable<SubscriptionPlan[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<SubscriptionPlan[]>(this.API_URL, { params });
  }

  createPlan(payload: SubscriptionPlanPayload): Observable<SubscriptionPlan> {
    return this.http.post<SubscriptionPlan>(this.API_URL, payload);
  }

  updatePlan(
    planId: string,
    payload: Partial<SubscriptionPlanPayload>,
  ): Observable<SubscriptionPlan> {
    return this.http.patch<SubscriptionPlan>(`${this.API_URL}/${planId}`, payload);
  }

  deletePlan(planId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${planId}`);
  }
}
