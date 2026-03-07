import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Role Guard
 * Usage:
 * canActivate: [AuthGuard, RoleGuard]
 * data: { roles: ['admin', 'teacher'] }
 */
export const RoleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForSessionRestore().pipe(
    map(() => {
      const expectedRoles: string[] = route.data['roles'] ?? [];
      const userRole = authService.getRole();

      // Not logged in
      if (!authService.isAuthenticated()) {
        return router.createUrlTree(['/login']);
      }

      // Role mismatch
      if (!userRole || !expectedRoles.includes(userRole)) {
        return redirectByRole(authService, router);
      }

      return true;
    }),
  );
};

function redirectByRole(authService: AuthService, router: Router) {
  const role = authService.getRole();

  switch (role) {
    case 'admin':
      return router.createUrlTree(['/admin/dashboard']);
    case 'teacher':
      return router.createUrlTree(['/teacher/dashboard']);
    case 'student':
      return router.createUrlTree(['/student/dashboard']);
    case 'super_admin':
      return router.createUrlTree(['/super-admin/dashboard']);
    default:
      return router.createUrlTree(['/login']);
  }
}
