import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import {
  DataTableComponent,
  TableColumn,
} from '../../../../shared/components/data-table/data-table.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { TenantService } from '../../services/tenant.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

interface ActivityItem {
  icon: string;
  iconBg: string;
  iconColor: string;
  message: string;
  time: string;
}

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent, DataTableComponent, HeaderComponent],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.css'],
})
export class SuperadminDashboardComponent implements OnInit {
  pageTitle = 'Super Admin Dashboard';
  notificationCount = 0;
  profile = {
    name: 'Super Admin',
    initials: 'S',
  };

  stats = [
    {
      title: 'Total Tenants',
      value: 0,
      icon: 'fa-solid fa-building',
      iconBgClass: 'bg-blue-100',
      iconColorClass: 'text-blue-600',
      bgColor: 'bg-white',
    },
    {
      title: 'Active Users',
      value: 0,
      icon: 'fa-solid fa-users',
      iconBgClass: 'bg-green-100',
      iconColorClass: 'text-green-600',
      bgColor: 'bg-white',
    },
    {
      title: 'Total Courses',
      value: 0,
      icon: 'fa-solid fa-book',
      iconBgClass: 'bg-purple-100',
      iconColorClass: 'text-purple-600',
      bgColor: 'bg-white',
    },
    {
      title: 'Revenue',
      value: '$0',
      icon: 'fa-solid fa-dollar-sign',
      iconBgClass: 'bg-yellow-100',
      iconColorClass: 'text-yellow-600',
      bgColor: 'bg-white',
    },
  ];

  tenantGrowthData = this.buildDefaultGrowthWindow(6);
  activityData = this.normalizeActivity();
  growthDeltaPercent = 0;

  organizationColumns: TableColumn[] = [
    { key: 'name', label: 'Organization Name', type: 'text' },
    { key: 'activeCourses', label: 'Active Courses', type: 'text' },
    { key: 'users', label: 'Users', type: 'text' },
  ];
  organizationRows: Array<{ name: string; activeCourses: number; users: number }> = [];
  totalOrganizations = 0;
  recentActivities: ActivityItem[] = [];

  constructor(
    private tenantService: TenantService,
    private authService: AuthService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user?.fullName) {
      this.profile.name = user.fullName;
      this.profile.initials = user.fullName.trim().charAt(0).toUpperCase();
    }

    this.tenantService.getDashboardOverview().subscribe({
      next: (overview) => {
        const stats = overview.stats;
        this.stats = [
          { ...this.stats[0], value: stats.totalTenants ?? 0 },
          { ...this.stats[1], value: stats.activeUsers ?? 0 },
          { ...this.stats[2], value: stats.totalCourses ?? 0 },
          {
            ...this.stats[3],
            value: `$${(stats.revenue ?? 0).toLocaleString()}`,
          },
        ];

        this.tenantGrowthData = overview.tenantGrowth?.length
          ? overview.tenantGrowth
          : this.buildDefaultGrowthWindow(6);
        this.activityData = this.normalizeActivity(overview.activity);
        this.organizationRows = overview.topOrganizations ?? [];
        this.totalOrganizations = stats.totalTenants ?? 0;
        this.growthDeltaPercent = this.calculateGrowthDelta(this.tenantGrowthData);
        this.recentActivities = this.buildRecentActivities();
        this.notificationCount = this.recentActivities.length;
      },
      error: (err) => {
        this.tenantGrowthData = this.buildDefaultGrowthWindow(6);
        this.activityData = this.normalizeActivity();
        this.organizationRows = [];
        this.totalOrganizations = 0;
        this.growthDeltaPercent = 0;
        this.recentActivities = this.buildRecentActivities();
        this.notificationCount = this.recentActivities.length;
        this.toastService.error(
          getApiErrorMessage(err, 'Unable to load super-admin dashboard data.'),
        );
      },
    });
  }

  private buildDefaultGrowthWindow(months: number): Array<{ month: string; tenants: number }> {
    const now = new Date();
    const rows: Array<{ month: string; tenants: number }> = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      rows.push({
        month: d.toLocaleString('en-US', { month: 'short' }),
        tenants: 0,
      });
    }
    return rows;
  }

  private normalizeActivity(
    values: Array<{ category: string; value: number; color: string }> = [],
  ): Array<{ category: string; value: number; color: string }> {
    const source = new Map(values.map((x) => [x.category.toLowerCase(), x.value]));
    return [
      { category: 'Active', value: source.get('active') ?? 0, color: 'bg-green-500' },
      { category: 'Pending', value: source.get('pending') ?? 0, color: 'bg-yellow-500' },
      {
        category: 'Inactive',
        value: source.get('inactive') ?? 0,
        color: 'bg-red-500',
      },
    ];
  }

  private calculateGrowthDelta(series: Array<{ month: string; tenants: number }>): number {
    if (series.length < 2) return 0;
    const last = series[series.length - 1].tenants;
    const prev = series[series.length - 2].tenants;
    if (prev <= 0) return last > 0 ? 100 : 0;
    return ((last - prev) / prev) * 100;
  }

  private buildRecentActivities(): ActivityItem[] {
    const topOrg = this.organizationRows[0];
    const active = this.activityData[0]?.value ?? 0;
    const pending = this.activityData[1]?.value ?? 0;
    const inactive = this.activityData[2]?.value ?? 0;

    const items: ActivityItem[] = [
      {
        icon: 'fa-solid fa-building',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        message: `${this.totalOrganizations} tenants currently in the platform`,
        time: 'Current snapshot',
      },
      {
        icon: 'fa-solid fa-check',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        message: `${active} tenants are currently active`,
        time: 'Current snapshot',
      },
      {
        icon: 'fa-solid fa-hourglass-half',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        message: `${pending} tenants are pending/trial`,
        time: 'Current snapshot',
      },
      {
        icon: 'fa-solid fa-exclamation',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        message: `${inactive} tenants are inactive/expired`,
        time: 'Current snapshot',
      },
    ];

    if (topOrg) {
      items.unshift({
        icon: 'fa-solid fa-trophy',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        message: `${topOrg.name} leads with ${topOrg.users} users`,
        time: 'Top organization',
      });
    }

    return items;
  }

  get maxTenantValue(): number {
    return Math.max(1, ...this.tenantGrowthData.map((d) => d.tenants));
  }

  get totalActivityValue(): number {
    return Math.max(
      1,
      this.activityData.reduce((sum, item) => sum + item.value, 0),
    );
  }

  getBarHeight(value: number): number {
    return (value / this.maxTenantValue) * 100;
  }

  getPercentage(value: number): number {
    return (value / this.totalActivityValue) * 100;
  }

  onNotificationClick(): void {}
  onProfileClick(): void {}
  onLogoutClick(): void {}
}
