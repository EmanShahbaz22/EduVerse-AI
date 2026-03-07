import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TenantApiResponse {
  id: string;
  tenantName: string;
  tenantLogoUrl?: string;
  adminEmail: string;
  status: string;
  contactNumber?: string | null;
  address?: string | null;
  subscriptionId?: string | null;
  subscriptionCategory?: string | null;
  subscriptionPlan?: string | null;
  subscriptionBillingCycle?: string | null;
  subscriptionPriceMonthly?: number | null;
  subscriptionStartDate?: string | null;
  subscriptionExpiryDate?: string | null;
  subscriptionNotes?: string | null;
  courses?: number;
  teachers?: number;
  students?: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface SuperAdminDashboardOverview {
  stats: {
    totalTenants: number;
    activeUsers: number;
    totalCourses: number;
    revenue: number;
  };
  tenantGrowth: Array<{ month: string; tenants: number }>;
  activity: Array<{ category: string; value: number; color: string }>;
  topOrganizations: Array<{ name: string; activeCourses: number; users: number }>;
}

export interface TenantListFilters {
  search?: string;
  status?: string;
  planCode?: string;
  category?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  private readonly API_URL = `${environment.apiUrl}/tenants`;
  private selectedTenant$ = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {}

  private mapSubscriptionStatus(status: string, category?: string | null): string {
    const normalized = (status || '').toLowerCase();
    const categoryNormalized = (category || 'free').toLowerCase();
    if (normalized === 'expired') return 'Expired';
    if (normalized === 'inactive') return 'Inactive';
    if (categoryNormalized === 'free') return 'Free';
    if (categoryNormalized === 'trial') return 'Trial';
    if (categoryNormalized === 'basic') return 'Basic';
    if (categoryNormalized === 'pro') return 'Pro';
    if (categoryNormalized === 'enterprise') return 'Enterprise';
    if (categoryNormalized === 'custom') return 'Custom';
    return 'Free';
  }

  private toListModel(tenant: TenantApiResponse) {
    return {
      id: tenant.id,
      name: tenant.tenantName,
      email: tenant.adminEmail,
      courses: Number(tenant.courses || 0),
      teachers: Number(tenant.teachers || 0),
      students: Number(tenant.students || 0),
      subscription: this.mapSubscriptionStatus(
        tenant.status,
        tenant.subscriptionCategory,
      ),
      status: tenant.status,
      adminEmail: tenant.adminEmail,
      contactNumber: tenant.contactNumber || '',
      address: tenant.address || '',
      subscriptionDetails: {
        category: tenant.subscriptionCategory || 'free',
        plan: tenant.subscriptionPlan || 'Free',
        billingCycle: tenant.subscriptionBillingCycle || 'monthly',
        pricePerMonth: Number(tenant.subscriptionPriceMonthly || 0),
        startDate: tenant.subscriptionStartDate || tenant.createdAt,
        expiryDate: tenant.subscriptionExpiryDate || tenant.updatedAt || tenant.createdAt,
        notes: tenant.subscriptionNotes || '',
        status: tenant.status,
      },
      subscriptionCategory: tenant.subscriptionCategory || 'free',
      subscriptionPlan: tenant.subscriptionPlan || '',
      subscriptionBillingCycle: tenant.subscriptionBillingCycle || 'monthly',
      subscriptionPriceMonthly: Number(tenant.subscriptionPriceMonthly || 0),
      subscriptionStartDate: tenant.subscriptionStartDate || tenant.createdAt,
      subscriptionExpiryDate:
        tenant.subscriptionExpiryDate || tenant.updatedAt || tenant.createdAt,
      subscriptionNotes: tenant.subscriptionNotes || '',
    };
  }

  getTenants(filters: TenantListFilters = {}): Observable<any[]> {
    let params = new HttpParams().set('skip', '0').set('limit', '100');
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.status?.trim()) {
      params = params.set('status', filters.status.trim().toLowerCase());
    }
    if (filters.planCode?.trim()) {
      params = params.set('planCode', filters.planCode.trim());
    }
    if (filters.category?.trim()) {
      params = params.set('category', filters.category.trim().toLowerCase());
    }

    return this.http
      .get<TenantApiResponse[]>(this.API_URL, { params })
      .pipe(map((tenants) => tenants.map((tenant) => this.toListModel(tenant))));
  }

  getTenantById(id: string): Observable<any> {
    return this.http
      .get<TenantApiResponse>(`${this.API_URL}/${id}`)
      .pipe(map((tenant) => this.toListModel(tenant)));
  }

  getDashboardOverview(months: number = 6, topN: number = 5): Observable<SuperAdminDashboardOverview> {
    return this.http.get<SuperAdminDashboardOverview>(
      `${this.API_URL}/dashboard/overview?months=${months}&topN=${topN}`
    );
  }

  setSelectedTenant(tenant: any) {
    this.selectedTenant$.next(tenant);
  }

  getSelectedTenant() {
    return this.selectedTenant$.asObservable();
  }

  updateTenant(updatedTenant: any): Observable<any> {
    const payload: any = {};
    if (updatedTenant.tenantName || updatedTenant.name) {
      payload.tenantName = updatedTenant.tenantName || updatedTenant.name;
    }
    if (updatedTenant.status) {
      payload.status = updatedTenant.status;
    }
    if (updatedTenant.contactNumber !== undefined) {
      payload.contactNumber = updatedTenant.contactNumber;
    }
    if (updatedTenant.address !== undefined) {
      payload.address = updatedTenant.address;
    }
    if (updatedTenant.subscriptionCategory) {
      payload.subscriptionCategory = updatedTenant.subscriptionCategory;
    }
    if (updatedTenant.subscriptionPlan !== undefined) {
      payload.subscriptionPlan = updatedTenant.subscriptionPlan;
    }
    if (updatedTenant.subscriptionBillingCycle !== undefined) {
      payload.subscriptionBillingCycle = updatedTenant.subscriptionBillingCycle;
    }
    if (updatedTenant.subscriptionPriceMonthly !== undefined) {
      payload.subscriptionPriceMonthly = Number(
        updatedTenant.subscriptionPriceMonthly,
      );
    }
    if (updatedTenant.subscriptionStartDate) {
      payload.subscriptionStartDate = updatedTenant.subscriptionStartDate;
    }
    if (updatedTenant.subscriptionExpiryDate) {
      payload.subscriptionExpiryDate = updatedTenant.subscriptionExpiryDate;
    }
    if (updatedTenant.subscriptionNotes !== undefined) {
      payload.subscriptionNotes = updatedTenant.subscriptionNotes;
    }

    return this.http
      .patch<TenantApiResponse>(`${this.API_URL}/${updatedTenant.id}`, payload)
      .pipe(
        map((tenant) => this.toListModel(tenant)),
        tap((tenant) => this.selectedTenant$.next(tenant)),
      );
  }

  deleteTenant(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
