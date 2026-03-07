import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { NotificationsComponent } from '../../components/notifications/notifications.component';
import { ProgressSnapshotComponent } from '../../components/progress-snapshot/progress-snapshot.component';
import { ContinueLearningComponent } from '../../components/continue-learning/continue-learning.component';
import { CoursesCardComponent, Course } from '../../components/courses-card/courses-card.component';
import { CommonModule } from '@angular/common';
import { BackendCourse, CourseService } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { QuizService } from '../../../teacher/services/quiz.service';
import { QuizSubmissionService } from '../../services/quiz-submission.service';
import { AssignmentService } from '../../../../shared/services/assignment.service';
import { forkJoin } from 'rxjs';
import { ToastService } from '../../../../shared/services/toast.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    StatCardComponent,
    NotificationsComponent,
    ProgressSnapshotComponent,
    ContinueLearningComponent,
    CoursesCardComponent,
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css',
})
export class StudentDashboardComponent implements OnInit {
  statsCards: StatCard[] = [
    {
      title: 'Courses Enrolled',
      value: '0',
      icon: 'fas fa-graduation-cap',
      bgColor: 'bg-blue-50',
      iconBgClass: 'bg-blue-100',
      iconColorClass: 'text-blue-600',
    },
    {
      title: 'Assignments Due',
      value: '0',
      icon: 'fas fa-book-open',
      bgColor: 'bg-purple-50',
      iconBgClass: 'bg-purple-100',
      iconColorClass: 'text-purple-600',
    },
    {
      title: 'Pending Quizzes',
      value: '0',
      icon: 'fas fa-chalkboard-teacher',
      bgColor: 'bg-orange-50',
      iconBgClass: 'bg-orange-100',
      iconColorClass: 'text-orange-600',
    },
  ];

  recommendations: Course[] = []; // Initially empty

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private quizService: QuizService,
    private submissionService: QuizSubmissionService,
    private assignmentService: AssignmentService,
    private toastService: ToastService,
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  // UPDATED: New method to load dashboard data from backend with proper types
  loadDashboardData() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();

    if (user) {
      const studentId = user.studentId || user.id;

      this.courseService.getStudentCourses(studentId, tenantId || undefined).subscribe({
        next: (courses: any[]) => {
          this.statsCards[0].value = courses.length.toString().padStart(2, '0');
          this.loadRecommendations(courses);
        },
        error: (err: { message: string }) => {
          console.error('Error loading enrolled courses', err);
          this.toastService.error(
            getApiErrorMessage(err, 'Unable to load your enrolled courses.')
          );
        }
      });

      // 2. Fetch Quizzes and Submissions to calculate pending
      forkJoin({
        quizzes: this.quizService.getStudentAvailableQuizzes(),
        submissions: this.submissionService.getSubmissionsByStudent(studentId)
      }).subscribe({
        next: ({ quizzes, submissions }) => {
          const pendingCount = quizzes.filter(q => {
            const hasSubmission = submissions.some(s => s.quizId === q.id);
            return !hasSubmission;
          }).length;

          this.statsCards[2].value = pendingCount.toString().padStart(2, '0');
        },
        error: (err) => {
          console.error('Error loading quiz stats', err);
          this.toastService.error(
            getApiErrorMessage(err, 'Unable to load quiz stats right now.')
          );
        }
      });

      if (tenantId) {
        this.assignmentService.getAssignments({ tenantId: tenantId, status: 'active' }).subscribe({
          next: (response) => {
            this.statsCards[1].value = response.total.toString().padStart(2, '0');
          },
          error: (err) => {
            console.error('Error loading assignment stats', err);
            this.toastService.error(
              getApiErrorMessage(err, 'Unable to load assignment stats right now.')
            );
          }
        });
      } else {
        this.statsCards[1].value = '0';
      }
    } else {
      this.recommendations = [];
    }
  }

  private loadRecommendations(enrolledCourses: BackendCourse[]) {
    const enrolledIds = new Set(
      (enrolledCourses || []).map((c) => c._id || c.id).filter(Boolean),
    );

    this.courseService.getMarketplaceCourses().subscribe({
      next: (courses) => {
        this.recommendations = (courses || [])
          .filter((c) => !enrolledIds.has(c._id || c.id || ''))
          .slice(0, 3)
          .map((c) => ({
            title: c.title,
            description: c.description || 'No description available.',
            image: c.thumbnailUrl || 'assets/images/default-course.jpg',
            instructor: c.instructorName || 'Instructor',
            level: c.level || 'Beginner',
            duration: c.duration || '',
          }));
      },
      error: () => {
        this.recommendations = [];
      },
    });
  }
}

interface StatCard {
  title: string;
  value: string;
  icon: string;
  bgColor: string;
  iconBgClass: string;
  iconColorClass: string;
}
