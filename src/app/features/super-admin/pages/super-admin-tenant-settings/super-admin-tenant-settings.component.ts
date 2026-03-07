import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { TenantInfoFormComponent } from '../../components/tenant-info-form/tenant-info-form.component';
import { SubscriptionDetailsComponent } from '../../components/subscription-details/subscription-details.component';
import { AccountActionsComponent } from '../../components/account-actions/account-actions.component';
import { TenantService } from '../../services/tenant.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../../shared/services/toast.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-super-admin-tenant-settings',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TenantInfoFormComponent, SubscriptionDetailsComponent, AccountActionsComponent],
  templateUrl: './super-admin-tenant-settings.component.html',
  styleUrl: './super-admin-tenant-settings.component.css'
})
export class SuperAdminTenantSettingsComponent implements OnInit, OnDestroy {
  tenant: any = null;
  subscriptionDetails: any = null;
  loadingTenant = false;

  private sub!: Subscription;

  constructor(
    private tenantService: TenantService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    const tenantId = this.route.snapshot.paramMap.get('id');
    if (tenantId) {
      this.loadingTenant = true;
      this.tenantService.getTenantById(tenantId).subscribe({
        next: (tenant) => {
          this.loadingTenant = false;
          this.tenantService.setSelectedTenant(tenant);
        },
        error: (err) => {
          this.loadingTenant = false;
          this.toastService.error(
            getApiErrorMessage(err, 'Unable to load tenant details.'),
          );
          this.router.navigate(['/super-admin/tenants']);
        },
      });
    } else {
      this.toastService.error('Invalid tenant URL. Please select a tenant again.');
      this.router.navigate(['/super-admin/tenants']);
    }

    this.sub = this.tenantService.getSelectedTenant().subscribe((tenant) => {
      if (tenant) {
        this.tenant = tenant;
        this.subscriptionDetails = tenant.subscriptionDetails ?? tenant.subscription;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  private toIsoDateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private addDays(base: Date, days: number): Date {
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    return next;
  }

  onSaveTenant(payload: any) {
    this.tenantService.updateTenant(payload).subscribe({
      next: () => this.toastService.success('Tenant information updated successfully.'),
      error: (err) =>
        this.toastService.error(getApiErrorMessage(err, 'Failed to update tenant information.')),
    });
  }

  onUpgrade() {
    if (!this.tenant) return;
    const now = new Date();
    this.tenantService
      .updateTenant({
        ...this.tenant,
        status: 'active',
        subscriptionCategory: this.tenant.subscriptionCategory || 'pro',
        subscriptionPlan: this.tenant.subscriptionPlan || 'Pro',
        subscriptionBillingCycle: this.tenant.subscriptionBillingCycle || 'monthly',
        subscriptionStartDate:
          this.tenant.subscriptionStartDate || this.toIsoDateOnly(now),
        subscriptionExpiryDate:
          this.tenant.subscriptionExpiryDate || this.toIsoDateOnly(this.addDays(now, 30)),
      })
      .subscribe({
        next: () => this.toastService.success('Tenant upgraded successfully.'),
        error: (err) =>
          this.toastService.error(getApiErrorMessage(err, 'Failed to upgrade tenant.')),
      });
  }

  onRenew() {
    if (!this.tenant) return;
    const now = new Date();
    const currentExpiry = this.tenant.subscriptionExpiryDate
      ? new Date(this.tenant.subscriptionExpiryDate)
      : now;
    const base = currentExpiry > now ? currentExpiry : now;
    this.tenantService
      .updateTenant({
        ...this.tenant,
        status: 'active',
        subscriptionExpiryDate: this.toIsoDateOnly(this.addDays(base, 30)),
      })
      .subscribe({
        next: () => this.toastService.success('Subscription renewed successfully.'),
        error: (err) =>
          this.toastService.error(getApiErrorMessage(err, 'Failed to renew subscription.')),
      });
  }

  onDeactivate() {
    if (!this.tenant) return;
    this.tenantService
      .updateTenant({ ...this.tenant, status: 'inactive' })
      .subscribe({
        next: () => this.toastService.success('Tenant deactivated successfully.'),
        error: (err) =>
          this.toastService.error(getApiErrorMessage(err, 'Failed to deactivate tenant.')),
      });
  }

  onDelete() {
    if (!this.tenant) return;
    this.tenantService.deleteTenant(this.tenant.id).subscribe({
      next: () => {
        this.toastService.success('Tenant deleted successfully.');
        this.router.navigate(['/super-admin/tenants']);
      },
      error: (err) =>
        this.toastService.error(getApiErrorMessage(err, 'Failed to delete tenant.')),
    });
  }
}
