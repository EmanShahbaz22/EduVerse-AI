import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import {
  BackendCourse,
  CourseService,
} from '../../../../core/services/course.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-create-assignment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-assignment.component.html',
  styleUrls: ['./create-assignment.component.css'],
})
export class CreateAssignmentComponent implements OnInit {
  @Input() assignment: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  assignmentForm!: FormGroup;
  isEditMode = false;
  formErrorMessage = '';
  loadingCourses = false;
  courses: string[] = [];

  attachments: File[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private courseService: CourseService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCourses();

    if (this.assignment) {
      this.isEditMode = true;
      this.populateFormWithAssignmentData(this.assignment);
    }
  }

  initForm(): void {
    this.assignmentForm = this.fb.group({
      id: [null],
      title: ['', Validators.required],
      course: ['', Validators.required],
      description: ['', Validators.required],
      dueDate: ['', Validators.required],
      dueTime: ['', Validators.required],
      totalMarks: ['', [Validators.required, Validators.min(1)]],
      passingMarks: ['', [Validators.required, Validators.min(1)]],
      allowLateSubmission: [false],
      submitted: [0],
      totalStudents: [50],
      status: ['active'],
    }, { validators: this.passingMarksValidator });
  }

  // Custom validator to ensure passing marks <= total marks
  passingMarksValidator(group: FormGroup) {
    const totalMarks = group.get('totalMarks')?.value;
    const passingMarks = group.get('passingMarks')?.value;
    
    if (totalMarks && passingMarks && parseInt(passingMarks) > parseInt(totalMarks)) {
      return { passingMarksExceeded: true };
    }
    return null;
  }

  populateFormWithAssignmentData(assignmentData: any): void {
    this.assignmentForm.patchValue({
      id: assignmentData.id,
      title: assignmentData.title,
      course: assignmentData.course,
      description: assignmentData.description,
      dueDate: assignmentData.dueDate,
      dueTime: assignmentData.dueTime,
      totalMarks: assignmentData.totalMarks,
      passingMarks: assignmentData.passingMarks,
      allowLateSubmission: assignmentData.allowLateSubmission,
      submitted: assignmentData.submitted,
      totalStudents: assignmentData.totalStudents,
      status: assignmentData.status,
    });

    if (assignmentData.course && !this.courses.includes(assignmentData.course)) {
      this.courses = [assignmentData.course, ...this.courses];
    }
  }

  private loadCourses(): void {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();

    if (!user) {
      this.formErrorMessage = 'Please log in to load your courses.';
      return;
    }

    if (!tenantId) {
      this.formErrorMessage = 'Tenant context is missing. Please log in again.';
      return;
    }

    const teacherId = user.teacherId || user.id;
    this.loadingCourses = true;

    this.courseService.getCourses(tenantId, { teacher_id: teacherId }).subscribe({
      next: (courses: BackendCourse[]) => {
        this.courses = courses
          .map((course) => course.title?.trim())
          .filter((title): title is string => !!title);
        this.loadingCourses = false;

        if (this.courses.length === 0) {
          this.formErrorMessage = 'No courses found. Create a course first.';
        }
      },
      error: (err) => {
        this.loadingCourses = false;
        this.formErrorMessage = getApiErrorMessage(
          err,
          'Unable to load courses. Please refresh and try again.',
        );
      },
    });
  }

  handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.attachments = [...this.attachments, ...Array.from(input.files)];
    }
  }

  removeAttachment(index: number): void {
    this.attachments = this.attachments.filter((_, i) => i !== index);
  }

  closeModal(): void {
    this.close.emit();
  }

  saveAssignment(): void {
    this.formErrorMessage = '';

    if (this.loadingCourses) {
      this.formErrorMessage = 'Courses are still loading. Please wait a moment.';
      return;
    }

    if (this.courses.length === 0) {
      this.formErrorMessage = 'No courses available for assignment creation.';
      return;
    }

    if (this.assignmentForm.invalid) {
      this.formErrorMessage = 'Please fill all required fields correctly.';
      return;
    }

    if (this.assignmentForm.errors?.['passingMarksExceeded']) {
      this.formErrorMessage = 'Passing marks cannot be greater than total marks.';
      return;
    }

    const formValue = this.assignmentForm.getRawValue();
    
    // Add ID if creating new
    if (!formValue.id) {
      formValue.id = Date.now();
    }

    this.save.emit(formValue);
  }
}
