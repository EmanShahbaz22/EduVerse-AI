import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import {
  DataTableComponent,
  TableColumn,
} from '../../../../shared/components/data-table/data-table.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  TenantListFilters,
  TenantService,
} from '../../services/tenant.service';
import {
  SubscriptionPlan,
  SubscriptionPlanService,
} from '../../services/subscription-plan.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-super-admin-tenants',
  standalone: true,
  imports: [
    HeaderComponent,
    DataTableComponent,
    StatCardComponent,
    CommonModule,
  ],
  templateUrl: './super-admin-tenants.component.html',
  styleUrl: './super-admin-tenants.component.css',
})
export class SuperAdminTenantsComponent implements OnInit {
  stats: TenantStats[] = [
    {
      title: 'Total Organizations',
      value: 0,
      icon: 'fa-solid fa-building',
      bgColor: 'bg-blue-50',
      iconBgClass: 'bg-blue-100',
      iconColorClass: 'text-blue-600',
    },
    {
      title: 'Active Subscriptions',
      value: 0,
      icon: 'fa-solid fa-circle-check',
      bgColor: 'bg-green-50',
      iconBgClass: 'bg-green-100',
      iconColorClass: 'text-green-600',
    },
    {
      title: 'Total Courses',
      value: 0,
      icon: 'fa-solid fa-book',
      bgColor: 'bg-yellow-50',
      iconBgClass: 'bg-yellow-100',
      iconColorClass: 'text-yellow-600',
    },
    {
      title: 'Total Teachers',
      value: 0,
      icon: 'fa-solid fa-chalkboard-teacher',
      bgColor: 'bg-purple-50',
      iconBgClass: 'bg-purple-100',
      iconColorClass: 'text-purple-600',
    },
  ];

  columns: TableColumn[] = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'courses', label: 'Courses', type: 'text' },
    { key: 'teachers', label: 'Teachers', type: 'text' },
    { key: 'students', label: 'Students', type: 'text' },
    {
      key: 'subscription',
      label: 'Subscription',
      type: 'badge',
      badgeColors: {
        Paid: 'bg-green-100 text-green-800',
        Free: 'bg-yellow-100 text-yellow-800',
        Trial: 'bg-blue-100 text-blue-800',
        Expired: 'bg-red-100 text-red-800',
        Inactive: 'bg-gray-100 text-gray-700',
        Basic: 'bg-indigo-100 text-indigo-800',
        Pro: 'bg-cyan-100 text-cyan-800',
        Enterprise: 'bg-emerald-100 text-emerald-800',
        Custom: 'bg-purple-100 text-purple-800',
      },
    },
  ];

  tenants: any[] = [];
  plans: SubscriptionPlan[] = [];
  loadingTenants = false;
  loadingPlans = false;

  filters: TenantListFilters = {
    search: '',
    status: '',
    planCode: '',
    category: '',
  };

  currentPage: number = 1;
  pageSize: number = 5;
  totalItems: number = 0;

  readonly categories = ['free', 'trial', 'basic', 'pro', 'enterprise', 'custom'];

  constructor(
    private router: Router,
    private tenantService: TenantService,
    private subscriptionPlanService: SubscriptionPlanService,
    private toastService: ToastService,
  ) { }

  ngOnInit() {
    this.loadPlans();
    this.loadTenants();
  }

  private loadPlans(): void {
    this.loadingPlans = true;
    this.subscriptionPlanService.getPlans().subscribe({
      next: (plans) => {
        this.plans = plans;
        this.loadingPlans = false;
      },
      error: (err) => {
        this.loadingPlans = false;
        this.toastService.error(
          getApiErrorMessage(err, 'Unable to load plan filters.'),
        );
      },
    });
  }

  loadTenants(): void {
    this.loadingTenants = true;
    this.tenantService.getTenants(this.filters).subscribe({
      next: (tenants) => {
        this.tenants = tenants;
        this.totalItems = tenants.length;
        this.refreshStats();
        this.loadingTenants = false;
      },
      error: (err) => {
        this.tenants = [];
        this.totalItems = 0;
        this.refreshStats();
        this.loadingTenants = false;
        this.toastService.error(
          getApiErrorMessage(err, 'Unable to load tenants.'),
        );
      },
    });
  }

  onSearchInput(event: Event): void {
    this.filters.search = (event.target as HTMLInputElement).value || '';
    this.currentPage = 1;
    this.loadTenants();
  }

  onStatusChange(event: Event): void {
    this.filters.status = (event.target as HTMLSelectElement).value || '';
    this.currentPage = 1;
    this.loadTenants();
  }

  onPlanCodeChange(event: Event): void {
    this.filters.planCode = (event.target as HTMLSelectElement).value || '';
    this.currentPage = 1;
    this.loadTenants();
  }

  onCategoryChange(event: Event): void {
    this.filters.category = (event.target as HTMLSelectElement).value || '';
    this.currentPage = 1;
    this.loadTenants();
  }

  clearFilters(): void {
    this.filters = { search: '', status: '', planCode: '', category: '' };
    this.currentPage = 1;
    this.loadTenants();
  }

  private refreshStats() {
    const totalOrganizations = this.tenants.length;
    const activeSubscriptions = this.tenants.filter(
      (t) => ['basic', 'pro', 'enterprise', 'custom', 'paid'].includes(
        String(t.subscription).toLowerCase(),
      )
    ).length;
    const totalCourses = this.tenants.reduce(
      (sum, t) => sum + Number(t.courses || 0),
      0
    );
    const totalTeachers = this.tenants.reduce(
      (sum, t) => sum + Number(t.teachers || 0),
      0,
    );

    this.stats = [
      { ...this.stats[0], value: totalOrganizations },
      { ...this.stats[1], value: activeSubscriptions },
      { ...this.stats[2], value: totalCourses },
      { ...this.stats[3], value: totalTeachers },
    ];
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onActionClick(tenant: any) {

    this.router.navigate(['/super-admin/tenant-settings', tenant.id]);
  }

  onEdit(tenant: any) {

    // this.router.navigate(['/super-admin/tenant-settings']);
    this.tenantService.setSelectedTenant(tenant);
    this.router.navigate(['/super-admin/tenant-settings', tenant.id]);
  }

  onDelete(tenant: any) {

    if (confirm(`Are you sure you want to delete ${tenant.name}?`)) {
      this.tenantService.deleteTenant(tenant.id).subscribe({
        next: () => {
          this.tenants = this.tenants.filter((t) => t.id !== tenant.id);
          this.totalItems = this.tenants.length;
          this.refreshStats();
          this.toastService.success('Tenant deleted successfully.');
        },
        error: (err) => {
          this.toastService.error(
            getApiErrorMessage(err, 'Failed to delete tenant.'),
          );
        },
      });
    }
  }
}

interface StatCard {
  title: string;
  value: string;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
}

interface TenantStats {
  title: string;
  value: number | string;
  icon: string;
  bgColor: string;
  iconBgClass: string;
  iconColorClass: string;
}

interface Tenant {
  id: number;
  name: string;
  email: string;
  courses: number;
  teachers: number;
  students: number;
  subscription: 'Paid' | 'Free' | 'Trial' | 'Expired';
  isActive: boolean;
}
