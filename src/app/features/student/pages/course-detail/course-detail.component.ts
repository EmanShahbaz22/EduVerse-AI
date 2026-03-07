import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { StudentProgressService } from '../../services/student-progress.service';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { PaymentModalComponent } from '../../../../shared/components/payment-modal/payment-modal.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ButtonComponent, PaymentModalComponent],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.css']
})
export class CourseDetailComponent implements OnInit {
  courseId: string = '';
  course: BackendCourse | null = null;
  loading: boolean = true;
  error: string | null = null;
  enrolling: boolean = false;
  showSuccessModal: boolean = false;
  showPaymentModal: boolean = false;
  isEnrolled: boolean = false;
  progress: number = 0;
  quizCount: number = 0;
  assignmentCount: number = 0; // Currently mapping 'reading' or custom types to assignments if applicable

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private progressService: StudentProgressService,
    private toastService: ToastService,
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.courseId = params.get('id') || '';
      if (this.courseId) {
        this.loadCourse();
      }
    });
    // Scroll to top when navigation occurs
    window.scrollTo(0, 0);
  }

  loadCourse() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();

    // Students can view marketplace courses cross-tenant without tenantId query.
    if (!user) {
      this.error = 'Please log in to view course details';
      this.loading = false;
      return;
    }

    if (user.role !== 'student' && !tenantId) {
      this.error = 'Tenant ID not found';
      this.loading = false;
      return;
    }

    const scopedTenantId = user.role === 'student' ? undefined : (tenantId ?? undefined);
    this.courseService.getCourseById(this.courseId, scopedTenantId).subscribe({
      next: (course) => {
        this.course = course;
        this.calculateStats();
        this.checkEnrollment();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = getApiErrorMessage(err, 'Failed to load course details');
        this.loading = false;
      }
    });
  }

  calculateStats() {
    this.quizCount = 0;
    this.assignmentCount = 0;
    if (this.course?.modules) {
      this.course.modules.forEach(module => {
        if (module.lessons) {
          module.lessons.forEach((lesson: any) => {
            const type = (lesson.type || '').toLowerCase();
            if (type === 'quiz') {
              this.quizCount++;
            } else if (type === 'document' || type === 'reading' || type === 'assignment' || type === 'file') {
              this.assignmentCount++;
            }
          });
        }
      });
    }
  }

  checkEnrollment() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();
    if (!user) return;

    const studentId = user.studentId || user.id;
    this.courseService.getStudentCourses(studentId, tenantId || undefined).subscribe({
      next: (courses) => {
        this.isEnrolled = courses.some(c => c._id === this.courseId || c.id === this.courseId);
        const progressTenantId = tenantId || this.course?.tenantId;
        if (this.isEnrolled && progressTenantId) {
          this.loadProgress(progressTenantId);
        }
      },
      error: (err) => {
        console.error('Error checking enrollment:', err);
        this.toastService.error(getApiErrorMessage(err, 'Unable to verify enrollment status.'));
      }
    });
  }

  loadProgress(tenantId: string) {
    this.progressService.getCourseProgress(this.courseId, tenantId).subscribe({
      next: (prog) => {
        this.progress = prog.progressPercentage;
      },
      error: (err) => {
        console.error('Error loading progress:', err);
        this.toastService.error(getApiErrorMessage(err, 'Unable to load progress right now.'));
      }
    });
  }

  get learningButtonText(): string {
    if (this.progress === 100) return "You've Completed This Course!";
    if (this.progress > 0) return "Continue Learning";
    return "Start Learning";
  }

  startLearning() {
    this.router.navigate(['/student/learn', this.courseId]);
  }

  enroll() {
    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // Check if course is paid
    if (this.course && !this.course.isFree && (this.course.price || 0) > 0) {
      this.showPaymentModal = true;
    } else {
      this.processEnrollment();
    }
  }

  processEnrollment() {
    const user = this.authService.getUser();

    if (!user) return;

    this.enrolling = true;

    this.courseService.enrollStudent(this.courseId).subscribe({
      next: () => {
        this.enrolling = false;
        this.showSuccessModal = true;
      },
      error: (err) => {
        this.enrolling = false;
        console.error(err);
        this.toastService.error(getApiErrorMessage(err, 'Enrollment failed.'));
      }
    });
  }

  closeModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/student/learn', this.courseId]);
  }

  goBack() {
    this.router.navigate(['/student/explore-courses']);
  }
}
