import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableColumn, DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CommonModule } from '@angular/common';
import { FiltersComponent } from '../../../../shared/components/filters/filters.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AdminService } from '../../../../core/services/admin.service';
import { AuthService } from '../../../auth/services/auth.service';
import { EntityModalComponent, FormField } from '../../../../shared/components/entity-modal/entity-modal.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [HeaderComponent, DataTableComponent, CommonModule, FiltersComponent, ButtonComponent, EntityModalComponent, FormsModule],
  templateUrl: './teachers.component.html',
  styleUrl: './teachers.component.css'
})
export class TeachersComponent implements OnInit {
  currentPage = 1;

  onPageChange(page: number) {
    this.currentPage = page;
  }

  teacherColumns: TableColumn[] = [
    { key: 'avatar', label: 'Teacher', type: 'avatar' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'assignedCoursesCount', label: 'Courses', type: 'text' },
    { key: 'role', label: 'Role', type: 'text' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeColors: {
        Active: 'bg-green-100 text-green-800',
        active: 'bg-green-100 text-green-800',
        Inactive: 'bg-red-100 text-red-800',
        inactive: 'bg-red-100 text-red-800',
      },
    },
  ];

  teachers: any[] = [];
  filteredTeachers: any[] = [];
  loading: boolean = true;

  // Modal state
  isModalOpen = false;
  isEditMode = false;
  modalTitle = 'Add Teacher';
  selectedTeacher: any = null;
  bulkEmailsInput = '';
  bulkDefaultPassword = '';
  bulkStatus = 'active';
  bulkInviteLoading = false;
  bulkCsvLoading = false;
  selectedCsvFile: File | null = null;

  teacherFields: FormField[] = [
    { name: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter full name' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter email address' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Enter password (min 6 characters)' },
    { name: 'contactNo', label: 'Contact Number', type: 'text', placeholder: 'Enter contact number' },
    { name: 'country', label: 'Country', type: 'text', placeholder: 'Enter country' },
    { name: 'qualifications', label: 'Qualifications', type: 'array', placeholder: 'e.g., PhD in Computer Science' },
    { name: 'subjects', label: 'Subjects', type: 'array', placeholder: 'e.g., Mathematics, Physics' },
    {
      name: 'status', label: 'Status', type: 'select', options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
  ];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private toastService: ToastService,
  ) { }

  ngOnInit() {
    this.loadTeachers();
  }

  loadTeachers() {
    this.loading = true;
    this.adminService.getTeachers().subscribe({
      next: (data) => {
        this.teachers = data.map(t => ({
          ...t,
          avatar: t.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'TR',
          assignedCoursesCount: t.assignedCourses?.length || 0,
          name: t.fullName
        }));
        this.filteredTeachers = [...this.teachers];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading teachers', err);
        this.toastService.error(
          getApiErrorMessage(err, 'Unable to load teachers right now.'),
        );
        this.loading = false;
      }
    });
  }

  onAddTeacher() {
    this.isEditMode = false;
    this.modalTitle = 'Add Teacher';
    this.selectedTeacher = null;
    this.isModalOpen = true;
  }

  onEditTeacher(teacher: any) {
    this.isEditMode = true;
    this.modalTitle = 'Edit Teacher';
    this.selectedTeacher = teacher;
    this.isModalOpen = true;
  }

  onDeleteTeacher(teacher: any) {
    if (confirm(`Are you sure you want to delete ${teacher.fullName}?`)) {
      this.adminService.deleteTeacher(teacher.id).subscribe({
        next: () => {
          this.toastService.success('Teacher removed successfully.');
          this.loadTeachers();
        },
        error: (err) => {
          this.toastService.error(
            getApiErrorMessage(err, 'Failed to delete teacher.'),
          );
        }
      });
    }
  }

  onModalClose() {
    this.isModalOpen = false;
    this.selectedTeacher = null;
  }

  onModalSubmit(formData: any) {
    const tenantId = this.authService.getTenantId();
    if (!tenantId) {
      this.toastService.error('Your tenant context is missing. Please log in again.');
      return;
    }

    const teacherData: any = {
      ...formData,
      tenantId,
      role: 'teacher'
    };

    // Only set default for new teachers if not provided
    if (!this.isEditMode) {
      teacherData.assignedCourses = [];
      if (!teacherData.status) teacherData.status = 'active';
    }

    // Remove password and immutable fields if editing
    if (this.isEditMode) {
      delete teacherData.password;
      delete teacherData.role;
      delete teacherData.tenantId;
    }

    const request = this.isEditMode
      ? this.adminService.updateTeacher(this.selectedTeacher.id, teacherData)
      : this.adminService.createTeacher(teacherData);

    request.subscribe({
      next: () => {
        this.onModalClose();
        this.loadTeachers();
        this.toastService.success(
          this.isEditMode
            ? 'Teacher updated successfully.'
            : 'Teacher added successfully.',
        );
      },
      error: (err) => {
        this.toastService.error(
          getApiErrorMessage(
            err,
            `Failed to ${this.isEditMode ? 'update' : 'create'} teacher.`,
          ),
        );
      }
    });
  }

  onBulkInviteTeachers() {
    const emails = this.bulkEmailsInput
      .split(/[,\n;]+/)
      .map((email) => email.trim())
      .filter(Boolean);

    if (!emails.length) {
      this.toastService.warning('Add at least one teacher email.');
      return;
    }

    this.bulkInviteLoading = true;
    this.adminService
      .bulkInviteTeachers({
        emails,
        defaultPassword: this.bulkDefaultPassword.trim() || undefined,
        status: this.bulkStatus || 'active',
      })
      .subscribe({
        next: (res) => {
          this.bulkInviteLoading = false;
          this.bulkEmailsInput = '';
          this.showBulkInviteSummary(res, 'Email invite');
          this.loadTeachers();
        },
        error: (err) => {
          this.bulkInviteLoading = false;
          this.toastService.error(
            getApiErrorMessage(err, 'Bulk teacher invite failed.'),
          );
        },
      });
  }

  onTeacherCsvSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedCsvFile = input.files?.[0] || null;
  }

  onBulkUploadTeachersCsv() {
    if (!this.selectedCsvFile) {
      this.toastService.warning('Please choose a CSV file first.');
      return;
    }
    this.bulkCsvLoading = true;
    this.adminService
      .bulkUploadTeachersCsv(this.selectedCsvFile, {
        defaultPassword: this.bulkDefaultPassword.trim() || undefined,
        statusValue: this.bulkStatus || 'active',
      })
      .subscribe({
        next: (res) => {
          this.bulkCsvLoading = false;
          this.selectedCsvFile = null;
          this.showBulkInviteSummary(res, 'CSV upload');
          this.loadTeachers();
        },
        error: (err) => {
          this.bulkCsvLoading = false;
          this.toastService.error(
            getApiErrorMessage(err, 'CSV upload failed.'),
          );
        },
      });
  }

  private showBulkInviteSummary(
    res: {
      created: number;
      linkedExisting: number;
      skipped: number;
      errors: string[];
      generatedPasswords: Record<string, string>;
    },
    mode: string,
  ) {
    this.toastService.success(
      `${mode} complete. Created: ${res.created}, Linked: ${res.linkedExisting}, Skipped: ${res.skipped}.`,
    );
    if (res.errors?.length) {
      const preview = res.errors.slice(0, 2).join(' | ');
      this.toastService.warning(
        `Some records failed: ${preview}${res.errors.length > 2 ? ' ...' : ''}`,
      );
    }
  }

  onFiltersChange(filters: { [key: string]: string }) {
    this.currentPage = 1;
    this.filteredTeachers = this.teachers.filter(t => {
      const matchesSearch = !filters['search'] ||
        (t.fullName && t.fullName.toLowerCase().includes(filters['search'].toLowerCase())) ||
        (t.email && t.email.toLowerCase().includes(filters['search'].toLowerCase()));

      const matchesStatus = !filters['status'] ||
        (t.status && t.status.toLowerCase() === filters['status'].toLowerCase());

      return matchesSearch && matchesStatus;
    })
  }
}
