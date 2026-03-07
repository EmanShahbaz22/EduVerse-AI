import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Assignment } from '../../../../shared/models/assignment.model';
import { AssignmentSubmission } from '../../../../shared/models/assignment-submission.model';
import { Course } from '../../../../shared/models/course.model';
import { AssignmentService } from '../../../../shared/services/assignment.service';
import { CourseService } from '../../../../shared/services/course.service';
import { TeacherProfileService, TeacherProfile } from '../../services/teacher-profile.service';
import { AssignmentCardComponent } from '../../components/assignment-card/assignment-card.component';
import { AssignmentModalComponent } from '../../components/assignment-modal/assignment-modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { Router, RouterModule } from '@angular/router';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';

interface SubmittedAssignmentView { assignment: Assignment; submission: AssignmentSubmission; }

@Component({
  selector: 'app-generate-assignments',
  standalone: true,
  imports: [
    AssignmentCardComponent, AssignmentModalComponent, ButtonComponent, StatCardComponent,
    HeaderComponent, EmptyStateComponent, FiltersComponent, CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
  ],
  templateUrl: './generate-assignments.component.html',
  styleUrls: ['./generate-assignments.component.css'],
})
export class GenerateAssignmentsComponent implements OnInit {
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  teacherProfile!: TeacherProfile;
  teacherId = '';
  tenantId = '';
  courses: Course[] = [];
  assignments: Assignment[] = [];
  assignmentDropdowns = [{ key: 'status', label: 'Status', options: ['active', 'inactive'] }];
  filters: { [key: string]: string } = { search: '', status: '', course: '' };
  assignmentSubmissions = new Map<string, AssignmentSubmission[]>();
  activeTab: 'active' | 'completed' = 'active';
  showModal = false;
  editingAssignmentId: string | null = null;
  formData: any = {};

  constructor(
    private teacherProfileService: TeacherProfileService,
    private assignmentService: AssignmentService,
    private courseService: CourseService,
    private router: Router,
  ) { }

  ngOnInit(): void { this.loadTeacherContext(); }

  private loadTeacherContext(): void {
    this.loading = true;
    this.teacherProfileService.getMyProfile().subscribe({
      next: (profile) => { this.teacherProfile = profile; this.teacherId = profile.id; this.tenantId = profile.tenantId ?? ''; this.loadCourses(); },
      error: () => { this.loading = false; this.showError('Failed to load teacher profile'); },
    });
  }

  private loadCourses(): void {
    this.courseService.getCourses({ teacher_id: this.teacherId, tenantId: this.tenantId }).subscribe({
      next: (courses) => {
        this.courses = courses;
        const dd = this.assignmentDropdowns.find(d => d.key === 'course');
        if (dd) dd.options = courses.map(c => c.courseName);
        this.loadAssignments();
      },
      error: () => { this.loading = false; this.showError('Failed to load courses'); },
    });
  }

  private loadAssignments(): void {
    this.loading = true;
    this.assignmentService.getAssignments({ sortBy: 'uploadedAt', order: -1 }).subscribe({
      next: (res) => {
        const ids = this.courses.map(c => c.id);
        this.assignments = (res.results ?? []).filter(a => ids.includes(a.courseId));
        this.updateAssignmentStatuses();
        this.loadAllSubmissions();
        this.loading = false;
      },
      error: () => { this.loading = false; this.showError('Failed to load assignments'); },
    });
  }

  private loadAllSubmissions(): void {
    this.assignments.forEach(a => this.assignmentService.getSubmissionsByAssignment(a.id).subscribe({
      next: (subs) => this.assignmentSubmissions.set(a.id, subs),
      error: () => this.assignmentSubmissions.set(a.id, []),
    }));
  }

  private updateAssignmentStatuses(): void {
    const now = new Date();
    this.assignments.forEach(a => { if (new Date(a.dueDate) < now && a.status === 'active') a.status = 'inactive'; });
  }

  get submittedAssignments(): SubmittedAssignmentView[] {
    const views: SubmittedAssignmentView[] = [];
    this.assignments.forEach(a => (this.assignmentSubmissions.get(a.id) ?? []).forEach(s => views.push({ assignment: a, submission: s })));
    return views;
  }

  get filteredSubmissions(): SubmittedAssignmentView[] { return this.activeTab === 'completed' ? this.submittedAssignments : []; }

  openCreateModal(): void { this.formData = {}; this.editingAssignmentId = null; this.showModal = true; }

  openEditModal(assignment: Assignment): void {
    if (assignment.status === 'inactive') { this.showError('Inactive assignment cannot be updated', 4000); return; }
    this.editingAssignmentId = assignment.id;
    this.formData = {
      title: assignment.title, description: assignment.description, courseId: assignment.courseId,
      dueDate: assignment.dueDate.split('T')[0], dueTime: assignment.dueDate.split('T')[1]?.slice(0, 5),
      totalMarks: assignment.totalMarks, passingMarks: assignment.passingMarks,
    };
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.formData = {}; this.editingAssignmentId = null; }

  onFiltersChange(updatedFilters: { [key: string]: string }) { this.filters = updatedFilters; }

  get filteredAssignments(): Assignment[] {
    let list = [...this.assignments];
    if (this.filters['status']) list = list.filter(a => a.status === this.filters['status']);
    if (this.filters['search']) { const s = this.filters['search'].toLowerCase(); list = list.filter(a => a.title.toLowerCase().includes(s)); }
    return list;
  }

  handleSubmit(payload: any): void {
    if (!payload.title || payload.title.trim().length < 3) { this.showError('Title must be at least 3 chars'); return; }
    if (payload.passingMarks > payload.totalMarks) { this.showError('Passing marks > total marks'); return; }
    const req$ = this.editingAssignmentId
      ? this.assignmentService.updateAssignment(this.editingAssignmentId, payload)
      : this.assignmentService.createAssignment(payload);
    req$.subscribe((result: Assignment) => {
      this.showSuccess('Assignment saved');
      if (this.editingAssignmentId) {
        const idx = this.assignments.findIndex(a => a.id === this.editingAssignmentId);
        if (idx !== -1) this.assignments[idx] = result;
      } else { this.assignments.unshift(result); this.assignmentSubmissions.set(result.id, []); }
      this.closeModal();
    });
  }

  deleteAssignment(assignment: Assignment): void {
    this.assignmentService.deleteAssignment(assignment.id).subscribe({
      next: () => { this.assignments = this.assignments.filter(a => a.id !== assignment.id); this.showSuccess('Deleted'); },
      error: () => this.showError('Failed to delete'),
    });
  }

  get activeCount(): number { return this.assignments.filter(a => a.status === 'active').length; }
  get completedCount(): number { return this.submittedAssignments.length; }
  get totalAssignmentsCount(): number { return this.assignments.length; }
  get totalSubmissionsCount(): number { return Array.from(this.assignmentSubmissions.values()).reduce((s, v) => s + v.length, 0); }

  showSuccess(message: string, duration = 3000): void { this.successMessage = message; setTimeout(() => (this.successMessage = null), duration); }
  showError(message: string, duration = 3000, closeOnErr = true): void {
    this.errorMessage = message;
    if (closeOnErr && this.showModal) this.closeModal();
    setTimeout(() => (this.errorMessage = null), duration);
  }

  cardColors = [
    { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border border-blue-300', button: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border border-purple-300', button: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
    { bg: 'bg-green-50', text: 'text-green-900', border: 'border border-green-300', button: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { bg: 'bg-pink-50', text: 'text-pink-900', border: 'border border-pink-300', button: 'bg-pink-100 text-pink-700 hover:bg-pink-200' },
    { bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border border-yellow-300', button: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  ];

  getCardColor(index: number, assignment: Assignment) {
    const c = this.cardColors[index % this.cardColors.length];
    return { bg: assignment.status === 'inactive' ? 'bg-gray-100' : c.bg, text: c.text, border: c.border, button: c.button };
  }

  getCardStyle(a: Assignment) { return a.status === 'inactive' ? 'bg-green-50 text-green-900 border border-green-300' : 'bg-blue-50 text-blue-900 border border-blue-300'; }
  getButtonStyle(a: Assignment) { return a.status === 'inactive' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'; }
}
