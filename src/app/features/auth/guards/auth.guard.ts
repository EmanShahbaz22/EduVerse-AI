import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard
 * - Blocks unauthenticated users
 * - Prevents authenticated users from accessing login/signup
 */
export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForSessionRestore().pipe(
    map(() => {
      const isAuthenticated = authService.isAuthenticated();
      const path = route.routeConfig?.path;

      // Block authenticated users from auth pages
      if (isAuthenticated && (path === 'login' || path === 'signup')) {
        return redirectByRole(authService, router);
      }

      // Block unauthenticated users from protected routes
      if (!isAuthenticated && state.url !== '/login' && state.url !== '/signup') {
        return router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url },
        });
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
