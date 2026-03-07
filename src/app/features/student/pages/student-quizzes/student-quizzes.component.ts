import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { QuizTakingModalComponent } from '../../components/quiz-taking-modal/quiz-taking-modal.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { QuizService } from '../../../teacher/services/quiz.service';
import { QuizSubmissionService } from '../../services/quiz-submission.service';
import { StudentProfileService, StudentProfile } from '../../services/student-profile.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Quiz } from '../../../../shared/models/quiz.model';
import { QuizSubmission, QuizSubmissionCreate, AnswerItem } from '../../../../shared/models/quiz-submission.model';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-student-quizzes',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, QuizTakingModalComponent, FiltersComponent],
  templateUrl: './student-quizzes.component.html',
  styleUrls: ['./student-quizzes.component.css'],
})
export class StudentQuizzesComponent implements OnInit {
  quizzes: any[] = [];
  filteredQuizzes: any[] = [];
  submissions: QuizSubmission[] = [];
  showModal = false;
  selectedQuiz: any = null;
  viewOnly = false;
  today = new Date();
  loading = false;
  error: string | null = null;
  filterDropdowns: { key: string; label: string; options: string[] }[] = [];
  searchText = '';
  selectedCourseFilter = '';
  selectedStatusFilter = '';
  selectedDueDateFilter = '';
  studentProfile: StudentProfile | null = null;
  studentId = '';
  tenantId = '';

  constructor(
    private quizService: QuizService,
    private submissionService: QuizSubmissionService,
    private studentProfileService: StudentProfileService,
    private toastService: ToastService,
  ) { }

  ngOnInit(): void { this.loadStudentContext(); }

  loadStudentContext(): void {
    this.loading = true; this.error = null;
    this.studentProfileService.getMyProfile().subscribe({
      next: (profile) => {
        this.studentProfile = profile; this.studentId = profile.id; this.tenantId = profile.tenantId || '';
        this.loadQuizzesAndSubmissions();
      },
      error: () => { this.error = 'Failed to load profile.'; this.loading = false; },
    });
  }

  loadQuizzesAndSubmissions(): void {
    this.quizService.getStudentAvailableQuizzes().subscribe({
      next: (quizzes) => this.loadSubmissions(quizzes),
      error: () => { this.error = 'Failed to load quizzes.'; this.loading = false; },
    });
  }

  private setupFilters(quizzes: Quiz[]): void {
    const names = [...new Set(quizzes.map(q => q.courseName))];
    this.filterDropdowns = [
      { key: 'course', label: 'Course', options: names },
      { key: 'status', label: 'Status', options: ['Completed', 'Pending'] },
      { key: 'dueDate', label: 'Due Date', options: ['Upcoming', 'Due Passed'] },
    ];
  }

  loadSubmissions(quizzes: Quiz[]): void {
    this.submissionService.getSubmissionsByStudent(this.studentId).subscribe({
      next: (subs) => {
        this.submissions = subs;
        this.quizzes = quizzes.map(q => this.transformQuizForDisplay(q));
        this.filteredQuizzes = this.quizzes;
        this.setupFilters(quizzes);
        this.loading = false;
      },
      error: () => {
        this.quizzes = quizzes.map(q => this.transformQuizForDisplay(q));
        this.filteredQuizzes = this.quizzes;
        this.setupFilters(quizzes);
        this.loading = false;
      },
    });
  }

  transformQuizForDisplay(quiz: Quiz): any {
    const sub = this.submissions.find(s => s.quizId === quiz.id);
    return {
      id: quiz.id, quizNo: quiz.quizNumber.toString().padStart(2, '0'),
      course: quiz.courseName, courseId: quiz.courseId, dueDate: new Date(quiz.dueDate),
      description: quiz.description || '', totalMarks: quiz.totalMarks,
      questions: quiz.questions.map((q, i) => ({
        index: i, statement: q.question, options: q.options, correctAnswer: q.answer,
        selectedAnswer: sub ? this.getSelectedAnswer(sub, i) : '',
      })),
      status: sub ? 'Completed' : 'Pending', submissionId: sub?.id,
      score: sub?.obtainedMarks || 0, percentage: sub?.percentage || 0, totalQuestions: quiz.questions.length,
    };
  }

  getSelectedAnswer(submission: QuizSubmission, questionIndex: number): string {
    return submission.answers.find(a => a.questionIndex === questionIndex)?.selected || '';
  }

  isDuePassed(quiz: any): boolean { return new Date(quiz.dueDate) < this.today; }

  onFiltersChange(filters: { [key: string]: string }): void {
    this.searchText = filters['search'] || '';
    this.selectedCourseFilter = filters['course'] || '';
    this.selectedStatusFilter = filters['status'] || '';
    this.selectedDueDateFilter = filters['dueDate'] || '';
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.quizzes];
    const today = new Date();
    if (this.selectedCourseFilter) result = result.filter(q => q.course === this.selectedCourseFilter);
    if (this.selectedStatusFilter) result = result.filter(q => q.status === this.selectedStatusFilter);
    if (this.selectedDueDateFilter) {
      if (this.selectedDueDateFilter === 'Upcoming') result = result.filter(q => new Date(q.dueDate) >= today && q.status !== 'Completed');
      else if (this.selectedDueDateFilter === 'Due Passed') result = result.filter(q => new Date(q.dueDate) < today);
    }
    if (this.searchText) {
      const s = this.searchText.toLowerCase();
      result = result.filter(q => q.quizNo.includes(s) || q.description?.toLowerCase().includes(s) || q.course.toLowerCase().includes(s));
    }
    this.filteredQuizzes = result;
  }

  getScoreColorClass(pct: number): string {
    return pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600';
  }

  openQuiz(quiz: any): void {
    if (this.isDuePassed(quiz) && quiz.status !== 'Completed') { this.toastService.warning('Due date passed.'); return; }
    this.selectedQuiz = quiz; this.viewOnly = quiz.status === 'Completed'; this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.selectedQuiz = null; }

  completeQuiz(quizResult: any): void {
    const answers: AnswerItem[] = quizResult.questions.map((q: any, i: number) => ({ questionIndex: i, selected: q.selectedAnswer }));
    const payload: QuizSubmissionCreate = { quizId: quizResult.id, courseId: this.selectedQuiz.courseId, answers };
    this.submissionService.submitQuiz(payload).subscribe({
      next: (sub) => {
        const idx = this.quizzes.findIndex(q => q.id === quizResult.id);
        if (idx > -1) {
          this.quizzes[idx] = { ...this.quizzes[idx], status: 'Completed', submissionId: sub.id, score: sub.obtainedMarks || 0, percentage: sub.percentage || 0 };
          this.applyFilters();
        }
        this.closeModal();
        this.toastService.success(`Score: ${sub.obtainedMarks}/${this.selectedQuiz.totalQuestions} (${sub.percentage}%)`);
      },
      error: (err) => {
        const msg = getApiErrorMessage(err, 'Submission failed.');
        if (msg.toLowerCase().includes('already submitted')) {
          this.toastService.warning('You already submitted this quiz.');
          this.loadQuizzesAndSubmissions();
        } else {
          this.toastService.error(msg);
        }
        this.closeModal();
      },
    });
  }
}
