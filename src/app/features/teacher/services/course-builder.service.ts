import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { CourseBuilderData, Module, EnrolledStudent, ReorderPayload, PublishPayload } from '../../../shared/models/course-builder.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CourseBuilderService {
  private readonly API_URL = `${environment.apiUrl}/courses`;
  constructor(private http: HttpClient) { }

  private params(tenantId: string) { return new HttpParams().set('tenantId', tenantId); }

  getCourseForBuilder(courseId: string, tenantId: string): Observable<CourseBuilderData> {
    return this.http.get<any>(`${this.API_URL}/${courseId}`, { params: this.params(tenantId) }).pipe(map(c => this.transform(c)));
  }

  updateCourse(courseId: string, tenantId: string, data: Partial<CourseBuilderData>): Observable<CourseBuilderData> {
    return this.http.put<any>(`${this.API_URL}/${courseId}`, data, { params: this.params(tenantId) }).pipe(map(c => this.transform(c)));
  }

  reorderLessons(courseId: string, tenantId: string, moduleId: string, lessonIds: string[]): Observable<CourseBuilderData> {
    return this.http.patch<any>(`${this.API_URL}/${courseId}/reorder/lessons`, { moduleId, lessonIds }, { params: this.params(tenantId) }).pipe(map(c => this.transform(c)));
  }

  reorderModules(courseId: string, tenantId: string, moduleIds: string[]): Observable<CourseBuilderData> {
    return this.http.patch<any>(`${this.API_URL}/${courseId}/reorder/modules`, { moduleIds }, { params: this.params(tenantId) }).pipe(map(c => this.transform(c)));
  }

  publishCourse(courseId: string, tenantId: string, publish: boolean): Observable<CourseBuilderData> {
    return this.http.post<any>(`${this.API_URL}/${courseId}/publish`, { publish }, { params: this.params(tenantId) }).pipe(map(c => this.transform(c)));
  }

  addModule(courseId: string, tenantId: string, module: Partial<Module>): Observable<CourseBuilderData> {
    const p = this.params(tenantId);
    return this.http.get<any>(`${this.API_URL}/${courseId}`, { params: p }).pipe(
      map(course => {
        const mods = course.modules || [];
        mods.push({ ...module, id: module.id || 'mod_' + Date.now(), order: mods.length, lessons: [] });
        return mods;
      }),
      switchMap(modules => this.http.put<any>(`${this.API_URL}/${courseId}`, { modules }, { params: p }).pipe(map(c => this.transform(c)))),
    );
  }

  private transform(course: any): CourseBuilderData {
    const modules = (course.modules || []).map((mod: any, i: number) => ({
      id: mod.id || `mod_${i}_${Date.now()}`, title: mod.title || `Module ${i + 1}`,
      description: mod.description || '', order: mod.order ?? i,
      lessons: (mod.lessons || []).map((l: any, li: number) => ({
        id: l.id || `lesson_${i}_${li}_${Date.now()}`, title: l.title || `Lesson ${li + 1}`,
        type: l.type || 'video', duration: l.duration || '', content: l.content || '', order: l.order ?? li,
      })),
      isExpanded: i === 0,
    }));
    const totalLessons = modules.reduce((t: number, m: Module) => t + m.lessons.length, 0);
    let totalSec = 0;
    modules.forEach((m: Module) => m.lessons.forEach(l => {
      if (l.duration) {
        const p = l.duration.split(':').map(Number);
        if (p.length === 2) totalSec += p[0] * 60 + p[1];
        else if (p.length === 3) totalSec += p[0] * 3600 + p[1] * 60 + p[2];
      }
    }));
    const hrs = Math.floor(totalSec / 3600), mins = Math.floor((totalSec % 3600) / 60);
    const totalDuration = totalSec > 0 ? (hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`) : '0m';
    return {
      id: course._id || course.id, title: course.title || '', description: course.description || '',
      category: course.category || 'General', level: course.level || 'Beginner',
      status: course.status || 'draft', isPublic: course.isPublic ?? true, modules,
      enrolledStudents: course.enrolledStudents || 0, totalLessons, totalDuration,
      thumbnailUrl: course.thumbnailUrl || '', teacherId: course.teacherId || '', tenantId: course.tenantId || '',
      isFree: course.isFree ?? true, price: course.price || 0, currency: course.currency || 'USD',
      createdAt: course.createdAt, updatedAt: course.updatedAt,
      instructorBio: course.instructorBio || '', hasCertificate: course.hasCertificate || false,
      hasBadges: course.hasBadges || false, hasLifetimeAccess: course.hasLifetimeAccess || false,
      courseCode: course.courseCode || '',
    };
  }

  getEnrolledStudents(courseId: string, tenantId: string): Observable<EnrolledStudent[]> {
    return this.http.get<any[]>(`${this.API_URL}/${courseId}/students`, { params: this.params(tenantId) }).pipe(
      map(students => students.map(s => ({
        id: s._id || s.id, fullName: s.fullName || s.name || 'Unknown', email: s.email || '',
        enrolledAt: s.enrolledAt || s.createdAt || new Date().toISOString(),
        progress: s.progress || 0, lessonsCompleted: s.lessonsCompleted || 0, lastAccessed: s.lastAccessed || s.lastActive,
      }))),
      catchError(() => of([])),
    );
  }

  unenrollStudent(courseId: string, tenantId: string, studentId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${courseId}/students/${studentId}`, { params: this.params(tenantId) });
  }
}
