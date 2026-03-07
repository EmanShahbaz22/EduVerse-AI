
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { CourseCardComponent, Course } from '../../components/course-card/course-card.component';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { StudentProgressService, CourseProgress } from '../../services/student-progress.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { forkJoin, catchError, of } from 'rxjs';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-explore-courses',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    FiltersComponent,
    CourseCardComponent
  ],
  templateUrl: './explore-courses.component.html',
  styleUrl: './explore-courses.component.css'
})
export class ExploreCoursesComponent implements OnInit {

  profile = {
    name: 'Student',
    initials: 'S'
  };

  // Filter configuration (categories populated dynamically after load)
  filterConfig = {
    searchPlaceholder: 'Search courses...',
    dropdowns: [
      {
        key: 'category',
        label: 'Category',
        options: [] as string[]
      },
      {
        key: 'level',
        label: 'Level',
        options: ['Beginner', 'Intermediate', 'Advanced']
      }
    ]
  };

  availableCourses: Course[] = []; // UPDATED: Initialized as empty
  filteredCourses: Course[] = [];
  loading: boolean = true;

  constructor(
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private progressService: StudentProgressService,
    private toastService: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) { }

  ngOnInit() {
    this.loadAvailableCourses();
  }

  // UPDATED: Fetch all courses for the tenant that are not necessarily the student's enrolled ones
  loadAvailableCourses() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();

    if (!user) {
      this.loading = false;
      return;
    }

    this.profile.name = user.fullName || 'Student';
    this.profile.initials = this.profile.name.trim().charAt(0).toUpperCase();

    const studentId = user.studentId || user.id;
    const isStudent = user.role === 'student';

    const courses$ = isStudent
      ? this.courseService.getMarketplaceCourses()
      : tenantId
        ? this.courseService.getCourses(tenantId)
        : of([]);
    const studentCourses$ =
      isStudent
        ? this.courseService.getStudentCourses(studentId, tenantId || undefined).pipe(catchError(() => of([])))
        : of([]);
    const progress$ =
      isStudent && tenantId
        ? this.progressService.getAllProgress(tenantId).pipe(catchError(() => of([])))
        : of([]);

    forkJoin({
      all: courses$,
      enrolled: studentCourses$,
      progress: progress$
    }).subscribe({
      next: ({ all, enrolled, progress }) => {
        const enrolledMap = new Map(enrolled.map(c => [c._id, c]));
        const progressMap = new Map<string, CourseProgress>(progress.map(p => [p.courseId, p]));

        this.availableCourses = all.map(bc => {
          const course = this.mapToFrontendCourse(bc);
          const en = enrolledMap.get(bc._id);
          if (en) {
            // Mark as enrolled variant to show progress
            course.variant = 'enrolled';
            course.nextLesson = en.nextLesson;

            const prog = progressMap.get(bc._id);
            if (prog) {
              course.progress = prog.progressPercentage;
              course.lessonsCompleted = prog.completedLessons.length;
            }
          }
          return course;
        });

        this.filteredCourses = [...this.availableCourses];
        this.buildCategoryFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading courses', err);
        this.toastService.error(getApiErrorMessage(err, 'Unable to load courses right now.'));
        this.loading = false;
      }
    });
  }

  private mapToFrontendCourse(bc: BackendCourse): Course {
    return {
      id: bc._id,
      title: bc.title,
      instructor: bc.instructorName || 'Instructor',
      image: bc.thumbnailUrl || 'assets/images/default-course.jpg',
      category: bc.category,
      level: (bc.level as any) || 'Beginner',
      duration: (bc as any).totalDuration || bc.duration || '0m',
      totalLessons: bc.totalLessons || 0,
      price: bc.isFree ? 0 : (bc.price || 0),
      enrolledStudents: bc.enrolledStudents || 0,
      description: bc.description || ''
    };
  }

  /** Build category dropdown from actual course data */
  private buildCategoryFilter() {
    const categories = [...new Set(this.availableCourses.map(c => c.category).filter(Boolean))];
    this.filterConfig.dropdowns[0].options = categories.sort();
  }

  // Handle filter changes
  onFiltersChange(filters: { [key: string]: string }) {
    let filtered = [...this.availableCourses];

    const searchQuery = filters['search'] || '';
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query))
      );
    }

    const category = filters['category'] || '';
    if (category) {
      filtered = filtered.filter(c => c.category === category);
    }

    const level = filters['level'] || '';
    if (level) {
      filtered = filtered.filter(c => c.level === level);
    }

    this.filteredCourses = filtered;
  }

  onCourseClick(course: Course | null) {
    if (!course) return;
    this.router.navigate(['/student/enroll-course', course.id]);
  }

  async onEnrollClick(course: Course) {
    const user = this.authService.getUser();

    if (!user) {
      this.toastService.error('Please log in to enroll.');
      this.router.navigate(['/login']);
      return;
    }

    // For paid courses, redirect to course detail page (which handles payment)
    if (course.price && course.price > 0) {
      this.router.navigate(['/student/enroll-course', course.id]);
      return;
    }

    const confirmed = await this.confirmDialog.confirm(
      `Enroll in "${course.title}"?`,
      'You will be enrolled in this free course.'
    );
    if (!confirmed) return;

    this.courseService.enrollStudent(course.id).subscribe({
      next: () => {
        this.toastService.success(`Enrolled in: ${course.title}`);
        this.router.navigate(['/student/courses']);
      },
      error: (err) => {
        this.toastService.error(getApiErrorMessage(err, 'Enrollment failed.'));
      }
    });
  }

  navigateToMyCourses() {
    this.router.navigate(['/student/courses']);
  }
}
