import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Always send credentials so HttpOnly cookies are included
  req = req.clone({ withCredentials: true });

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401) {
        const isAuthProbe =
          req.url.includes('/auth/token') ||
          req.url.includes('/auth/me') ||
          req.url.includes('/auth/logout');
        if (!isAuthProbe) {
          authService.logout();
        }
      }
      return throwError(() => err);
    }),
  );
};
