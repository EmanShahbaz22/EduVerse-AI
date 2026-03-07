import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CommonModule } from '@angular/common';
import { CourseService, BackendCourse, CourseCreate } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-teacher-courses',
  imports: [HeaderComponent, DataTableComponent, CommonModule, FiltersComponent, ButtonComponent],
  templateUrl: './teacher-courses.component.html',
  styleUrl: './teacher-courses.component.css',
  standalone: true,
})
export class TeacherCoursesComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'title', label: 'Course Name', type: 'text' },
    { key: 'courseCode', label: 'Course Code', type: 'text' },
    { key: 'duration', label: 'Duration', type: 'text' },
    { key: 'enrolledStudents', label: 'Students', type: 'text' },
    { key: 'visibility', label: 'Visibility', type: 'badge', badgeColors: { 'public': 'bg-green-100 text-green-800', 'private': 'bg-gray-100 text-gray-800' } },
    { key: 'status', label: 'Status', type: 'badge', badgeColors: { 'draft': 'bg-yellow-100 text-yellow-800', 'published': 'bg-green-100 text-green-800' } },
  ];

  visibleActions = ['view', 'delete'];
  courses: any[] = [];
  allCourses: any[] = [];
  loading = true;
  filterConfig = { searchPlaceholder: 'Search courses...', dropdowns: [{ key: 'status', label: 'Status', options: ['draft', 'published'] }] };

  constructor(
    private router: Router, private courseService: CourseService,
    private authService: AuthService, private toastService: ToastService,
    private confirmDialog: ConfirmDialogService
  ) { }

  ngOnInit() { this.loadTeacherCourses(); }

  loadTeacherCourses() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();
    if (user && tenantId) {
      this.loading = true;
      const teacherId = user.teacherId || user.id;
      this.courseService.getCourses(tenantId, { teacher_id: teacherId }).subscribe({
        next: (backendCourses) => {
          this.allCourses = backendCourses.map(c => ({
            ...c, courseCode: c.courseCode || this.generateCourseCode(c.title),
            duration: this.calculateCourseDuration(c), enrolledStudents: c.enrolledStudents ?? 0,
            visibility: (c.isPublic !== false) ? 'public' : 'private'
          }));
          this.courses = [...this.allCourses];
          this.loading = false;
        },
        error: () => { this.loading = false; },
      });
    }
  }

  onFiltersChange(filters: { [key: string]: string }) {
    const search = filters['search']?.toLowerCase() || '';
    const status = filters['status'] || '';
    this.courses = this.allCourses.filter((c) => {
      const ms = !search || c.title?.toLowerCase().includes(search) || c.courseCode?.toLowerCase().includes(search);
      const mstat = !status || c.status === status;
      return ms && mstat;
    });
  }

  onCreateCourse(): void {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();
    if (!user || !tenantId) { this.toastService.error('Please log in again.'); return; }

    const newCourse: CourseCreate = {
      title: 'Untitled Course', description: '', category: 'General', level: 'Beginner',
      status: 'draft', teacherId: user.teacherId || user.id, tenantId: tenantId,
    };

    this.courseService.createCourse(newCourse).subscribe({
      next: (course) => {
        this.toastService.success('Course created! Redirecting...');
        this.router.navigate(['/teacher/courses/builder', course._id || course.id]);
      },
      error: () => this.toastService.error('Failed to create course.'),
    });
  }

  onEditCourse(course: BackendCourse): void { this.router.navigate(['/teacher/courses/builder', course._id || course.id]); }

  async onDeleteCourse(course: BackendCourse): Promise<void> {
    const courseId = course._id || course.id;
    const tenantId = this.authService.getTenantId();
    if (!courseId || !tenantId) return;

    if (await this.confirmDialog.confirmDelete(course.title)) {
      this.courseService.deleteCourse(courseId, tenantId).subscribe({
        next: () => { this.toastService.success('Course deleted'); this.loadTeacherCourses(); },
        error: () => this.toastService.error('Failed to delete course'),
      });
    }
  }

  onView(course: any): void { this.onEditCourse(course); }

  private generateCourseCode(title: string): string {
    if (!title) return 'CRS-0000';
    const words = title.trim().split(/\s+/).slice(0, 3);
    const initials = words.map(w => w.charAt(0).toUpperCase()).join('');
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${initials || 'CRS'}-${suffix}`;
  }

  private calculateCourseDuration(course: any): string {
    if (!course.modules || course.modules.length === 0) return course.duration || '0m';
    let totalSeconds = 0;
    course.modules.forEach((mod: any) => {
      if (mod.lessons) {
        mod.lessons.forEach((lesson: any) => {
          if (lesson.duration) {
            const parts = lesson.duration.split(':').map(Number);
            if (parts.length === 2) totalSeconds += parts[0] * 60 + parts[1];
            else if (parts.length === 3) totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        });
      }
    });
    if (totalSeconds === 0) return course.duration || '0m';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
}
