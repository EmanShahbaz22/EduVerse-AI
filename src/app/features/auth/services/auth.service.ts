import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, finalize, map, switchMap, take, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

import { LoginRequest } from '../models/login-request.model';
import { AuthResponse } from '../models/auth-response.model';
import { JwtPayload, User } from '../models/user.model';
export type { JwtPayload, User };

export interface TeacherTenantContext {
  tenantId: string;
  tenantName: string;
  teacherId: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  private sessionRestoredSubject = new BehaviorSubject<boolean>(false);
  sessionRestored$ = this.sessionRestoredSubject.asObservable();
  private API = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    const body = new URLSearchParams();
    body.set('username', payload.email);
    body.set('password', payload.password);
    body.set('grant_type', 'password');

    return this.http
      .post<AuthResponse>(`${this.API}/auth/token`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true,
      })
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  signup(payload: any, role: 'student' | 'teacher' | 'admin'): Observable<any> {
    return this.http.post(`${this.API}/auth/${role}/signup`, payload);
  }

  getTeacherTenants(): Observable<{
    activeTenantId: string | null;
    tenants: TeacherTenantContext[];
  }> {
    return this.http.get<{
      activeTenantId: string | null;
      tenants: TeacherTenantContext[];
    }>(`${this.API}/auth/teacher/tenants`, { withCredentials: true });
  }

  switchTeacherTenant(tenantId: string): Observable<{
    message: string;
    tenantId: string;
    tenantName: string;
    teacherId: string;
  }> {
    return this.http
      .post<{
        message: string;
        tenantId: string;
        tenantName: string;
        teacherId: string;
      }>(
        `${this.API}/auth/teacher/switch-tenant`,
        { tenantId },
        { withCredentials: true },
      )
      .pipe(
        switchMap((result) =>
          this.http
            .get<{
              user_id: string;
              role: string;
              tenant_id: string | null;
              student_id?: string | null;
              teacher_id?: string | null;
              admin_id?: string | null;
            }>(`${this.API}/auth/me`, { withCredentials: true })
            .pipe(
              tap((resp) => this.applyMeResponse(resp)),
              map(() => result),
            ),
        ),
      );
  }

  logout(): void {
    this.http.post(`${this.API}/auth/logout`, {}, { withCredentials: true }).subscribe();
    localStorage.removeItem('tenantId');
    this.currentUserSubject.next(null);
    this.sessionRestoredSubject.next(true);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getAccessToken(): string | null {
    // Kept for backward compat — cookie is now the primary auth mechanism
    return null;
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  getRole(): User['role'] | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  getTenantId(): string | null {
    return this.currentUserSubject.value?.tenantId ?? null;
  }

  waitForSessionRestore(): Observable<boolean> {
    return this.sessionRestored$.pipe(filter(Boolean), take(1));
  }

  // --- Private helpers ---

  private restoreSession(): void {
    this.http
      .get<{
        user_id: string;
        role: string;
        tenant_id: string | null;
        student_id?: string | null;
        teacher_id?: string | null;
        admin_id?: string | null;
      }>(
        `${this.API}/auth/me`,
        { withCredentials: true }
      )
      .pipe(finalize(() => this.sessionRestoredSubject.next(true)))
      .subscribe({
        next: (resp) => this.applyMeResponse(resp),
        error: () => this.currentUserSubject.next(null),
      });
  }

  private applyMeResponse(resp: {
    user_id: string;
    role: string;
    tenant_id: string | null;
    student_id?: string | null;
    teacher_id?: string | null;
    admin_id?: string | null;
  }): void {
    const user: User = {
      id: resp.user_id,
      email: '',
      role: resp.role?.replace('-', '_') as User['role'],
      tenantId: resp.tenant_id ?? undefined,
      studentId: resp.student_id ?? undefined,
      teacherId: resp.teacher_id ?? undefined,
      adminId: resp.admin_id ?? undefined,
    };
    if (user.tenantId) {
      localStorage.setItem('tenantId', user.tenantId);
    } else {
      localStorage.removeItem('tenantId');
    }
    this.currentUserSubject.next(user);
  }

  private decodeJwt(token: string): JwtPayload {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded)) as JwtPayload;
  }

  private mapJwtToUser(payload: JwtPayload): User {
    return {
      id: payload.user_id,
      email: payload.email ?? '',
      role: payload.role?.replace('-', '_') as User['role'],
      tenantId: payload.tenant_id,
      studentId: payload.student_id,
      teacherId: payload.teacher_id,
      adminId: payload.admin_id,
      fullName: payload.full_name,
    };
  }

  private redirectByRole(role: User['role']): void {
    const routes: Record<string, string> = {
      student: '/student/dashboard',
      teacher: '/teacher/dashboard',
      admin: '/admin/dashboard',
      super_admin: '/super-admin/dashboard',
    };
    this.router.navigate([routes[role] ?? '/login']);
  }

  private mapAuthResponseUser(res: AuthResponse): User | null {
    if (!res.user) return null;
    return {
      id: res.user.id,
      email: res.user.email ?? '',
      role: res.user.role?.replace('-', '_') as User['role'],
      tenantId: res.user.tenantId ?? undefined,
      studentId: res.user.studentId ?? undefined,
      teacherId: res.user.teacherId ?? undefined,
      adminId: res.user.adminId ?? undefined,
      fullName: res.user.fullName ?? undefined,
    };
  }

  private handleAuthSuccess(res: AuthResponse): void {
    let user = this.mapAuthResponseUser(res);
    if (!user && res.access_token) {
      const payload = this.decodeJwt(res.access_token);
      user = this.mapJwtToUser(payload);
    }
    if (!user) {
      throw new Error('Invalid login response');
    }
    if (user.tenantId) localStorage.setItem('tenantId', user.tenantId);
    this.currentUserSubject.next(user);
    this.sessionRestoredSubject.next(true);
    this.redirectByRole(user.role);
  }
}
