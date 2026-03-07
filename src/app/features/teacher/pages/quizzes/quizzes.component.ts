import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CreateQuizComponent } from '../../components/create-quiz/create-quiz.component';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { QuizService } from '../../services/quiz.service';
import { TeacherProfileService, TeacherProfile } from '../../services/teacher-profile.service';
import { CourseService } from '../../../../shared/services/course.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { Quiz, QuizCreate, QuizUpdate } from '../../../../shared/models/quiz.model';
import { Course } from '../../../../shared/models/course.model';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-quizzes',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateQuizComponent, HeaderComponent, FiltersComponent],
  templateUrl: './quizzes.component.html',
  styleUrls: ['./quizzes.component.css'],
})
export class QuizzesComponent implements OnInit {
  @ViewChild(CreateQuizComponent) createQuizModal!: CreateQuizComponent;
  quizzes: Quiz[] = [];
  filteredQuizzes: Quiz[] = [];
  courses: Course[] = [];
  showModal = false;
  selectedQuiz: any = null;
  loading = false;
  error: string | null = null;
  filterDropdowns: { key: string; label: string; options: string[] }[] = [];
  searchText = '';
  selectedCourseFilter = '';
  selectedStatusFilter = '';
  selectedSubmissionFilter = '';
  quizSubmissionStatus: Map<string, boolean> = new Map();
  teacherProfile: TeacherProfile | null = null;
  teacherId = '';
  tenantId = '';
  hasSubmissions = false;

  constructor(
    private quizService: QuizService,
    private teacherProfileService: TeacherProfileService,
    private courseService: CourseService,
    private toastService: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) { }

  ngOnInit(): void { this.loadTeacherContext(); }

  loadTeacherContext(): void {
    this.loading = true;
    this.error = null;
    this.teacherProfileService.getMyProfile().subscribe({
      next: (profile) => {
        this.teacherProfile = profile;
        this.teacherId = profile.id;
        this.tenantId = profile.tenantId || '';
        this.loadCourses();
        this.loadQuizzes();
      },
      error: () => { this.error = 'Failed to load teacher profile.'; this.loading = false; },
    });
  }

  loadCourses(): void {
    if (!this.tenantId) return;
    this.courseService.getCourses({ tenantId: this.tenantId, teacher_id: this.teacherId }).subscribe({
      next: (courses) => {
        this.courses = courses;
        this.filterDropdowns = [
          { key: 'course', label: 'Course', options: courses.map(c => c.title) },
          { key: 'status', label: 'Status', options: ['Active', 'Inactive'] },
          { key: 'submissions', label: 'Submissions', options: ['Has Submissions', 'No Submissions', 'Due Passed'] },
        ];
      },
      error: () => { },
    });
  }

  loadQuizzes(): void {
    this.loading = true;
    this.quizService.getQuizzes({ tenant_id: this.tenantId, teacher_id: this.teacherId, sort: '-createdAt' }).subscribe({
      next: (quizzes) => {
        this.quizzes = quizzes;
        this.filteredQuizzes = quizzes;
        this.updateQuizStatus();
        this.loadSubmissionStatus(quizzes);
        this.loading = false;
      },
      error: () => { this.error = 'Failed to load quizzes.'; this.loading = false; },
    });
  }

  loadSubmissionStatus(quizzes: Quiz[]): void {
    quizzes.forEach(q => this.quizService.checkQuizSubmissions(q.id).subscribe({
      next: (r) => this.quizSubmissionStatus.set(q.id, r.hasSubmissions),
      error: () => this.quizSubmissionStatus.set(q.id, false),
    }));
  }

  openModal(quiz?: Quiz): void {
    if (quiz) {
      this.quizService.checkQuizSubmissions(quiz.id).subscribe({
        next: (r) => { this.hasSubmissions = r.hasSubmissions; this.selectedQuiz = this.transformQuizForModal(quiz); this.showModal = true; },
        error: () => { this.hasSubmissions = false; this.selectedQuiz = this.transformQuizForModal(quiz); this.showModal = true; },
      });
    } else {
      this.hasSubmissions = false; this.selectedQuiz = null; this.showModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false; this.selectedQuiz = null; this.hasSubmissions = false;
    if (this.createQuizModal) this.createQuizModal.resetSaving();
  }

  onFiltersChange(filters: { [key: string]: string }): void {
    this.searchText = filters['search'] || '';
    this.selectedCourseFilter = filters['course'] || '';
    this.selectedStatusFilter = filters['status'] || '';
    this.selectedSubmissionFilter = filters['submissions'] || '';
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.quizzes];
    if (this.selectedCourseFilter) result = result.filter(q => q.courseName === this.selectedCourseFilter);
    if (this.selectedStatusFilter) result = result.filter(q => q.status === this.selectedStatusFilter.toLowerCase());
    if (this.selectedSubmissionFilter) {
      const today = new Date();
      if (this.selectedSubmissionFilter === 'Has Submissions') result = result.filter(q => this.quizSubmissionStatus.get(q.id) === true);
      else if (this.selectedSubmissionFilter === 'No Submissions') result = result.filter(q => this.quizSubmissionStatus.get(q.id) === false && new Date(q.dueDate) >= today);
      else if (this.selectedSubmissionFilter === 'Due Passed') result = result.filter(q => new Date(q.dueDate) < today);
    }
    if (this.searchText) {
      const s = this.searchText.toLowerCase();
      result = result.filter(q => q.quizNumber.toString().includes(s) || q.description?.toLowerCase().includes(s) || q.courseName.toLowerCase().includes(s));
    }
    this.filteredQuizzes = result;
  }

  addOrUpdateQuiz(formData: any): void { formData.id ? this.updateQuiz(formData) : this.createQuiz(formData); }

  createQuiz(formData: any): void {
    if (!formData.courseId) { this.toastService.warning('Please select a course first.'); return; }
    const course = this.courses.find(c => c.id === formData.courseId);
    const payload: QuizCreate = {
      courseId: formData.courseId, courseName: course?.title || formData.course || '',
      teacherId: this.teacherId, tenantId: this.tenantId,
      quizNumber: parseInt(formData.quizNo, 10) || 1, description: formData.description || '',
      dueDate: new Date(formData.dueDate).toISOString(),
      questions: this.transformQuestionsForBackend(formData.questions),
      totalMarks: formData.questions.length, aiGenerated: false,
    };
    this.quizService.createQuiz(payload).subscribe({
      next: (created) => { this.quizzes.unshift(created); this.applyFilters(); this.closeModal(); this.toastService.success('Quiz created!'); },
      error: (err) => {
        this.toastService.error(getApiErrorMessage(err, 'Failed to create quiz.'));
        this.createQuizModal?.resetSaving();
      },
    });
  }

  updateQuiz(formData: any): void {
    const updates: QuizUpdate = {
      quizNumber: parseInt(formData.quizNo, 10), description: formData.description,
      dueDate: new Date(formData.dueDate).toISOString(),
      questions: this.transformQuestionsForBackend(formData.questions), totalMarks: formData.questions.length,
    };
    this.quizService.updateQuiz(formData.id, updates).subscribe({
      next: (updated) => {
        const idx = this.quizzes.findIndex(q => q.id === updated.id);
        if (idx > -1) this.quizzes[idx] = updated;
        this.updateQuizStatus(); this.applyFilters(); this.closeModal(); this.toastService.success('Quiz updated!');
      },
      error: (err) => {
        this.toastService.error(getApiErrorMessage(err, 'Failed to update quiz.'));
        this.createQuizModal?.resetSaving();
      },
    });
  }

  async deleteQuiz(quizId: string): Promise<void> {
    if (!await this.confirmDialog.confirmDelete('this quiz')) return;
    this.quizService.deleteQuiz(quizId).subscribe({
      next: () => { this.quizzes = this.quizzes.filter(q => q.id !== quizId); this.applyFilters(); this.toastService.success('Quiz deleted!'); },
      error: (err) => { this.toastService.error(getApiErrorMessage(err, 'Failed to delete quiz.')); },
    });
  }

  transformQuizForModal(quiz: Quiz): any {
    return {
      id: quiz.id, quizNo: quiz.quizNumber.toString().padStart(2, '0'),
      course: quiz.courseName, courseId: quiz.courseId, dueDate: new Date(quiz.dueDate),
      description: quiz.description || '',
      questions: quiz.questions.map(q => ({ statement: q.question, options: q.options, correctAnswer: q.answer })),
      status: quiz.status === 'active' ? 'Active' : 'Inactive',
    };
  }

  transformQuestionsForBackend(questions: any[]): any[] {
    return questions.map(q => ({ question: q.statement, options: q.options, answer: q.correctAnswer }));
  }

  updateQuizStatus(): void {
    const today = new Date();
    this.quizzes.forEach(q => { if (new Date(q.dueDate) < today && q.status === 'active') q.status = 'inactive'; });
  }

  getQuizDisplayNumber(quiz: Quiz): string { return quiz.quizNumber.toString().padStart(2, '0'); }
}
