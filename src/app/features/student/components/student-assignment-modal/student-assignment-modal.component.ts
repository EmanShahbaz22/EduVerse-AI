import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ModalShellComponent } from '../../../../shared/components/modal-shell/modal-shell.component';
import { CourseService } from '../../../../core/services/course.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-student-assignment-modal',
  standalone: true,
  imports: [CommonModule, ModalShellComponent],
  templateUrl: './student-assignment-modal.component.html',
})
export class StudentAssignmentModalComponent implements OnInit {
  @Input() show = false;
  @Input() assignment: any;
  @Input() tenantId: any;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<string>();

  selectedFile: File | null = null;
  courseName = '';
  uploading = false;

  constructor(private courseService: CourseService, private http: HttpClient) { }

  ngOnInit(): void {
    this.loadCourseName();
  }

  private loadCourseName(): void {
    if (!this.assignment?.courseId || !this.tenantId) return;
    this.courseService
      .getCourseById(this.assignment.courseId, this.tenantId)
      .subscribe({
        next: (course) => (this.courseName = course.title ?? 'Unknown Course'),
        error: () => (this.courseName = 'Unknown Course'),
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  submitAssignment(): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http
      .post<{ url: string }>(`${environment.apiUrl}/uploads/assignment`, formData)
      .subscribe({
        next: (res) => {
          this.submit.emit(res.url);
          this.uploading = false;
          this.closeModal();
        },
        error: () => {
          this.uploading = false;
        },
      });
  }

  closeModal(): void {
    this.selectedFile = null;
    this.close.emit();
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  get isFormValid(): boolean {
    return !!this.selectedFile;
  }
}
