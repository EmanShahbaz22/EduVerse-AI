# Static Data Audit

## Updated to Dynamic
1. `src/app/features/super-admin/services/tenant.service.ts`
   - Replaced local mock tenant array with real `/tenants` API calls.
2. `src/app/features/super-admin/pages/super-admin-tenants/super-admin-tenants.component.ts`
   - Tenant table now API-backed.
   - Stats now derived from fetched tenant data (no fixed counters).
3. `src/app/features/super-admin/pages/super-admin-tenant-settings/super-admin-tenant-settings.component.ts`
   - Read/update/delete now use backend API service calls.

## Remaining Static/Placeholder Data
1. `src/app/features/super-admin/pages/super-admin-dashboard/super-admin-dashboard.component.ts`
   - Dashboard cards/charts/top organizations are still hardcoded demo values.
2. `src/app/features/student/pages/student-dashboard/student-dashboard.component.ts`
   - Assignment card includes TODO/static fallback value.
3. Multiple components still use `alert()` placeholders for user messaging and unfinished flows.
4. `src/app/features/super-admin/pages/super-admin-tenants/super-admin-tenants.component.ts`
   - Revenue stat is still placeholder (`$0`) because API does not return billing totals.

## Recommendation
1. Create a `SuperAdminDashboardService` to load dashboard stats from backend aggregates.
2. Replace placeholder `alert()` UX with shared toast/notification service.
3. Remove remaining static fallback metrics once corresponding APIs are available.
