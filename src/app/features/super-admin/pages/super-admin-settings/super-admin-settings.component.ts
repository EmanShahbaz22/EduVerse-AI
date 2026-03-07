import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { TenantService } from '../../services/tenant.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { SubscriptionPlanService } from '../../services/subscription-plan.service';

@Component({
  selector: 'app-super-admin-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './super-admin-settings.component.html',
  styleUrl: './super-admin-settings.component.css'
})
export class SuperAdminSettingsComponent {
  profileName = 'Super Admin';
  loadingOverview = false;
  loadingPlans = false;
  activePlans = 0;
  inactivePlans = 0;
  lastSyncedAt: Date | null = null;

  overview = {
    totalTenants: 0,
    activeUsers: 0,
    totalCourses: 0,
    revenue: 0,
  };

  constructor(
    private tenantService: TenantService,
    private authService: AuthService,
    private toastService: ToastService,
    private subscriptionPlanService: SubscriptionPlanService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user?.fullName) {
      this.profileName = user.fullName;
    }
    this.loadOverview();
    this.loadPlanSummary();
  }

  loadOverview(): void {
    this.loadingOverview = true;
    this.tenantService.getDashboardOverview().subscribe({
      next: (data) => {
        this.loadingOverview = false;
        this.overview = {
          totalTenants: data.stats?.totalTenants ?? 0,
          activeUsers: data.stats?.activeUsers ?? 0,
          totalCourses: data.stats?.totalCourses ?? 0,
          revenue: data.stats?.revenue ?? 0,
        };
        this.lastSyncedAt = new Date();
      },
      error: (err) => {
        this.loadingOverview = false;
        this.toastService.error(
          getApiErrorMessage(err, 'Unable to load settings overview.'),
        );
      },
    });
  }

  loadPlanSummary(): void {
    this.loadingPlans = true;
    this.subscriptionPlanService.getPlans().subscribe({
      next: (plans) => {
        this.loadingPlans = false;
        this.activePlans = plans.filter((p) => p.status === 'active').length;
        this.inactivePlans = plans.filter((p) => p.status !== 'active').length;
      },
      error: (err) => {
        this.loadingPlans = false;
        this.toastService.error(
          getApiErrorMessage(err, 'Unable to load subscription plan summary.'),
        );
      },
    });
  }
}
