import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  HostListener,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth.service';
import { ToastService } from '../../services/toast.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface MenuItem {
  icon: string;
  label: string;
  path: string;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnChanges, OnInit, OnDestroy {
  @Input() role: 'admin' | 'teacher' | 'super_admin' | 'super-admin' | 'student' = 'admin';
  @Output() toggleSidebar = new EventEmitter<boolean>();
  private destroy$ = new Subject<void>();

  isOpen = true;
  isMobileSidebarVisible = false;
  isMobile = false;
  menuItems: MenuItem[] = [];
  teacherTenants: Array<{ tenantId: string; tenantName: string; teacherId: string; active: boolean }> = [];
  selectedTenantId = '';
  switchingTenant = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
  ) { }

  ngOnInit() {
    this.updateScreenSize();
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.selectedTenantId = user?.tenantId || '';
      });
    if (this.role === 'teacher') {
      this.loadTeacherTenants();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  updateScreenSize() {
    this.isMobile = window.innerWidth < 992;
    if (this.isMobile) {
      this.isMobileSidebarVisible = false; // hidden by default
    } else {
      this.isMobileSidebarVisible = true; // always visible on desktop
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['role']) {
      this.setMenuItems();
      if (this.role === 'teacher') {
        this.loadTeacherTenants();
      } else {
        this.teacherTenants = [];
      }
    }
  }

  private setMenuItems() {
    if (this.role === 'admin') {
      this.menuItems = [
        {
          icon: 'fa-solid fa-chart-pie',
          label: 'Dashboard',
          path: 'dashboard',
        },
        { icon: 'fa-solid fa-users', label: 'Teachers', path: 'teachers' },
        { icon: 'fa-solid fa-users', label: 'Students', path: 'students' },
        { icon: 'fa-solid fa-book', label: 'Courses', path: 'courses' },
        { icon: 'fa-solid fa-cog', label: 'Settings', path: 'settings' },
      ];
    } else if (this.role === 'teacher') {
      this.menuItems = [
        {
          icon: 'fa-solid fa-chart-pie',
          label: 'Dashboard',
          path: 'dashboard',
        },
        { icon: 'fa-solid fa-book', label: 'My Courses', path: 'courses' },
        { icon: 'fa-solid fa-question', label: 'Quizzes', path: 'quizzes' },
        { icon: 'fa-solid fa-file', label: 'Assignments', path: 'assignments' },
        {
          icon: 'fa-solid fa-user',
          label: 'Track Student',
          path: 'trackstudent',
        },
        { icon: 'fa-solid fa-cog', label: 'Settings', path: 'settings' },
      ];
    } else if (this.role === 'student') {
      this.menuItems = [
        {
          icon: 'fa-solid fa-chart-pie',
          label: 'Dashboard',
          path: 'dashboard',
        },
        { icon: 'fa-solid fa-book', label: 'My Courses', path: 'courses' },
        {
          icon: 'fa-solid fa-book',
          label: 'Explore Courses',
          path: 'explore-courses',
        },
        { icon: 'fa-solid fa-question', label: 'Quizzes', path: 'quizzes' },
        { icon: 'fa-solid fa-file', label: 'Assignments', path: 'assignments' },
        {
          icon: 'fa-solid fa-robot',
          label: 'Ai Assistant',
          path: 'ai-assistant',
        },
        { icon: 'fa-solid fa-user', label: 'Leaderboard', path: 'leaderboard' },
        { icon: 'fa-solid fa-cog', label: 'Settings', path: 'settings' },
      ];
    } else if (this.role === 'super-admin' || this.role === 'super_admin') {
      this.menuItems = [
        {
          icon: 'fa-solid fa-chart-pie',
          label: 'Dashboard',
          path: 'dashboard',
        },
        { icon: 'fa-solid fa-building', label: 'Tenants', path: 'tenants' },
        {
          icon: 'fa-solid fa-layer-group',
          label: 'Subscription Plans',
          path: 'subscription-plans',
        },
        { icon: 'fa-solid fa-cog', label: 'Settings', path: 'settings' },
      ];
    } else {
      this.menuItems = [];
    }
  }

  /** Universal toggle for both desktop and mobile */
  toggleSidebarAction() {
    if (this.isMobile) {
      this.isMobileSidebarVisible = !this.isMobileSidebarVisible;
    } else {
      this.isOpen = !this.isOpen;
      this.toggleSidebar.emit(this.isOpen);
    }
  }

  closeMobileSidebar() {
    if (this.isMobile) {
      this.isMobileSidebarVisible = false;
    }
  }

  logout() {
    this.authService.logout();
  }

  loadTeacherTenants() {
    this.authService.getTeacherTenants().subscribe({
      next: (res) => {
        this.teacherTenants = res.tenants || [];
        this.selectedTenantId =
          res.activeTenantId ||
          this.teacherTenants.find((x) => x.active)?.tenantId ||
          '';
      },
      error: () => {
        this.teacherTenants = [];
      },
    });
  }

  onTenantSwitch() {
    if (!this.selectedTenantId || this.switchingTenant) return;
    this.switchingTenant = true;
    this.authService.switchTeacherTenant(this.selectedTenantId).subscribe({
      next: (res) => {
        this.switchingTenant = false;
        this.toastService.success(`Switched to ${res.tenantName}`);
        this.loadTeacherTenants();
        this.router.navigateByUrl('/teacher/dashboard').then(() => {
          window.location.reload();
        });
      },
      error: (err) => {
        this.switchingTenant = false;
        this.toastService.error(
          getApiErrorMessage(err, 'Failed to switch tenant context.'),
        );
      },
    });
  }

  toggleDesktopSidebar() {
    this.isOpen = !this.isOpen;
    this.toggleSidebar.emit(this.isOpen);
  }
}
