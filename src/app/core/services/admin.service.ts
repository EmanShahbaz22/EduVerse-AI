import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ENDPOINTS } from '../constants/api.constants';

export interface AdminTeacher {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  assignedCourses?: any[];
}

export interface AdminStudent {
  _id: string;
  fullName: string;
  email: string;
  country?: string;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly ADMIN_API = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getTeachers(): Observable<AdminTeacher[]> {
    return this.http
      .get<{ total: number; teachers: AdminTeacher[] }>(
        `${ENDPOINTS.ADMINS.BASE}/teachers`,
      )
      .pipe(map((response) => response.teachers || []));
  }

  getStudents(): Observable<AdminStudent[]> {
    return this.http
      .get<{ total: number; students: AdminStudent[] }>(
        `${ENDPOINTS.ADMINS.BASE}/students`,
      )
      .pipe(map((response) => response.students || []));
  }

  getCourses(): Observable<any[]> {
    return this.http
      .get<{ total: number; courses: any[] }>(`${ENDPOINTS.ADMINS.BASE}/courses`)
      .pipe(map((response) => response.courses || []));
  }

  deleteTeacher(teacherId: string): Observable<any> {
    return this.http.delete(`${this.ADMIN_API}/teachers/${teacherId}`);
  }

  createTeacher(data: any): Observable<any> {
    return this.http.post(`${ENDPOINTS.TEACHERS.BASE}/`, data);
  }

  bulkInviteTeachers(payload: {
    emails: string[];
    defaultPassword?: string;
    status?: string;
    tenantId?: string;
  }): Observable<{
    created: number;
    linkedExisting: number;
    skipped: number;
    errors: string[];
    generatedPasswords: Record<string, string>;
  }> {
    return this.http.post<{
      created: number;
      linkedExisting: number;
      skipped: number;
      errors: string[];
      generatedPasswords: Record<string, string>;
    }>(`${ENDPOINTS.TEACHERS.BASE}/bulk-invite`, payload);
  }

  bulkUploadTeachersCsv(
    file: File,
    opts: {
      defaultPassword?: string;
      statusValue?: string;
      tenantId?: string;
    } = {},
  ): Observable<{
    created: number;
    linkedExisting: number;
    skipped: number;
    errors: string[];
    generatedPasswords: Record<string, string>;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    if (opts.defaultPassword) {
      formData.append('defaultPassword', opts.defaultPassword);
    }
    if (opts.statusValue) {
      formData.append('statusValue', opts.statusValue);
    }
    if (opts.tenantId) {
      formData.append('tenantId', opts.tenantId);
    }

    return this.http.post<{
      created: number;
      linkedExisting: number;
      skipped: number;
      errors: string[];
      generatedPasswords: Record<string, string>;
    }>(`${ENDPOINTS.TEACHERS.BASE}/bulk-upload-csv`, formData);
  }

  updateTeacher(teacherId: string, data: any): Observable<any> {
    const { id, _id, ...updateData } = data;
    return this.http.put(
      `${this.ADMIN_API}/update-teacher/${teacherId}`,
      updateData,
    );
  }

  createStudent(data: any): Observable<any> {
    const tenantId = localStorage.getItem('tenantId');
    return this.http.post(`${ENDPOINTS.STUDENTS.BASE}/${tenantId}`, data);
  }

  updateStudent(studentId: string, data: any): Observable<any> {
    const { id, _id, ...updateData } = data;
    return this.http.patch(`${this.ADMIN_API}/students/${studentId}`, updateData);
  }

  deleteStudent(studentId: string): Observable<any> {
    return this.http.delete(`${this.ADMIN_API}/students/${studentId}`);
  }

  createCourse(data: any): Observable<any> {
    return this.http.post(`${ENDPOINTS.COURSES.BASE}/`, data);
  }

  updateCourse(courseId: string, data: any): Observable<any> {
    const { id, _id, instructorName, enrolledStudents, ...updateData } = data;
    const tenantId = localStorage.getItem('tenantId');
    return this.http.put(
      `${ENDPOINTS.COURSES.BASE}/${courseId}?tenantId=${tenantId}`,
      updateData,
    );
  }

  deleteCourse(courseId: string): Observable<any> {
    const tenantId = localStorage.getItem('tenantId');
    return this.http.delete(
      `${ENDPOINTS.COURSES.BASE}/${courseId}?tenantId=${tenantId}`,
    );
  }
}
