import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CourseInfoCardComponent } from '../../components/course-info-card/course-info-card.component';
import { CourseBuilderTabsComponent } from '../../components/course-builder-tabs/course-builder-tabs.component';
import { CurriculumModuleComponent } from '../../components/curriculum-module/curriculum-module.component';
import { AddModuleModalComponent } from '../../components/add-module-modal/add-module-modal.component';
import { AddLessonModalComponent } from '../../components/add-lesson-modal/add-lesson-modal.component';
import { BulkUploadModalComponent } from '../../components/bulk-upload-modal/bulk-upload-modal.component';
import { CourseBuilderService } from '../../services/course-builder.service';
import { TeacherProfileService } from '../../services/teacher-profile.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { CourseBuilderData, Module, Lesson, EnrolledStudent, generateId, generateCourseCode, calculateTotalLessons, calculateTotalDuration } from '../../../../shared/models/course-builder.model';
type TabType = 'content' | 'settings' | 'students' | 'reviews';
@Component({
  selector: 'app-course-builder', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CourseInfoCardComponent, CourseBuilderTabsComponent, CurriculumModuleComponent, AddModuleModalComponent, AddLessonModalComponent, BulkUploadModalComponent],
  templateUrl: './course-builder.component.html', styleUrl: './course-builder.component.css',
})
export class CourseBuilderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  course: CourseBuilderData | null = null;
  courseId = ''; tenantId = ''; teacherId = ''; teacherName = ''; teacherInitial = 'T';
  activeTab: TabType = 'content';
  isLoading = true; isSaving = false; error: string | null = null;
  categoryOptions = ['General', 'Computer Science', 'Mathematics', 'Science', 'Business', 'Arts', 'Language', 'Health', 'Engineering', 'Other'];
  levelOptions = ['Beginner', 'Intermediate', 'Advanced'];
  showAddModuleModal = false; showAddLessonModal = false; showBulkUploadModal = false;
  editingModule: Module | null = null; editingLesson: Lesson | null = null; selectedModuleId: string | null = null;
  enrolledStudents: EnrolledStudent[] = []; isLoadingStudents = false; studentSearchQuery = '';
  draggedModuleIndex: number | null = null;
  constructor(
    private route: ActivatedRoute, private router: Router, private courseBuilderService: CourseBuilderService,
    private teacherProfileService: TeacherProfileService, private toastService: ToastService, private confirmDialog: ConfirmDialogService,
  ) { }
  ngOnInit(): void { this.loadTeacherContext(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
  loadTeacherContext(): void {
    this.teacherProfileService.getMyProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: (profile: any) => {
        this.tenantId = profile.tenantId || ''; this.teacherId = profile.id || '';
        const name = profile.fullName || profile.user?.fullName || profile.email?.split('@')[0] || 'Teacher';
        this.teacherName = name; this.teacherInitial = name.charAt(0).toUpperCase();
        this.courseId = this.route.snapshot.paramMap.get('id') || '';
        if (this.courseId && this.tenantId) this.loadCourse();
        else { this.error = 'Missing course ID or tenant info'; this.isLoading = false; }
      },
      error: () => { this.error = 'Failed to load profile'; this.isLoading = false; },
    });
  }
  private loadCourse(): void {
    this.isLoading = true; this.error = null;
    this.courseBuilderService.getCourseForBuilder(this.courseId, this.tenantId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (course) => { this.course = course; this.isLoading = false; },
      error: () => { this.error = 'Failed to load course'; this.isLoading = false; },
    });
  }
  onToggleModule(moduleId: string): void { if (this.course) this.course.modules = this.course.modules.map(m => ({ ...m, isExpanded: m.id === moduleId ? !m.isExpanded : m.isExpanded })); }
  onCollapseAll(): void { if (this.course) this.course.modules = this.course.modules.map(m => ({ ...m, isExpanded: false })); }
  openAddModuleModal(module?: Module): void { this.editingModule = module || null; this.showAddModuleModal = true; }
  closeAddModuleModal(): void { this.showAddModuleModal = false; this.editingModule = null; }
  onSaveModule(moduleData: Partial<Module>): void {
    if (!this.course) return;
    if (this.editingModule) {
      this.course.modules = this.course.modules.map(m => m.id === this.editingModule!.id ? { ...m, ...moduleData } : m);
      this.toastService.success('Module updated');
    } else {
      this.course.modules.push({ id: generateId(), title: moduleData.title || 'New Module', description: moduleData.description || '', order: this.course.modules.length, lessons: [], isExpanded: true });
      this.toastService.success('Module added');
    }
    this.closeAddModuleModal(); this.saveCourse();
  }
  async onDeleteModule(moduleId: string): Promise<void> {
    if (!this.course) return;
    const mod = this.course.modules.find(m => m.id === moduleId);
    if (await this.confirmDialog.confirmDelete(mod?.title)) {
      this.course.modules = this.course.modules.filter(m => m.id !== moduleId).map((m, i) => ({ ...m, order: i }));
      this.course.totalLessons = calculateTotalLessons(this.course.modules);
      this.toastService.success('Module deleted'); this.saveCourse();
    }
  }
  openAddLessonModal(moduleId: string, lesson?: Lesson): void { this.selectedModuleId = moduleId; this.editingLesson = lesson || null; this.showAddLessonModal = true; }
  closeAddLessonModal(): void { this.showAddLessonModal = false; this.editingLesson = null; this.selectedModuleId = null; }
  onSaveLesson(lessonData: Partial<Lesson>): void {
    if (!this.course || !this.selectedModuleId) return;
    const mod = this.course.modules.find(m => m.id === this.selectedModuleId);
    if (!mod) return;
    if (this.editingLesson) {
      mod.lessons = mod.lessons.map(l => l.id === this.editingLesson!.id ? { ...l, ...lessonData } : l);
      this.toastService.success('Lesson updated');
    } else {
      mod.lessons.push({ id: generateId(), title: lessonData.title || 'New Lesson', type: lessonData.type || 'video', duration: lessonData.duration || '', content: lessonData.content || '', order: mod.lessons.length });
      this.toastService.success('Lesson added');
    }
    this.course.totalLessons = calculateTotalLessons(this.course.modules);
    this.closeAddLessonModal(); this.saveCourse();
  }
  async onDeleteLesson(moduleId: string, lessonId: string): Promise<void> {
    if (!this.course) return;
    const mod = this.course.modules.find(m => m.id === moduleId);
    if (!mod) return;
    const lesson = mod.lessons.find(l => l.id === lessonId);
    if (await this.confirmDialog.confirmDelete(lesson?.title)) {
      mod.lessons = mod.lessons.filter(l => l.id !== lessonId).map((l, i) => ({ ...l, order: i }));
      this.course.totalLessons = calculateTotalLessons(this.course.modules);
      this.toastService.success('Lesson deleted'); this.saveCourse();
    }
  }
  onModuleReorder(modules: Module[]): void {
    if (!this.course) return;
    this.course.modules = modules.map((m, i) => ({ ...m, order: i }));
    this.courseBuilderService.reorderModules(this.courseId, this.tenantId, modules.map(m => m.id)).pipe(takeUntil(this.destroy$)).subscribe({ error: () => { this.toastService.error('Failed to save order'); this.loadCourse(); } });
  }
  onModuleDragStart(event: DragEvent, index: number): void {
    this.draggedModuleIndex = index;
    if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index)); }
  }
  onModuleDragOver(event: DragEvent, _index: number): void { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'; }
  onModuleDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    if (!this.course || this.draggedModuleIndex === null || this.draggedModuleIndex === targetIndex) { this.draggedModuleIndex = null; return; }
    const modules = [...this.course.modules];
    const [dragged] = modules.splice(this.draggedModuleIndex, 1);
    modules.splice(targetIndex, 0, dragged);
    this.onModuleReorder(modules.map((m, i) => ({ ...m, order: i })));
    this.draggedModuleIndex = null;
  }
  onModuleDragEnd(): void { this.draggedModuleIndex = null; }
  onLessonReorder(moduleId: string, lessons: Lesson[]): void {
    if (!this.course) return;
    const idx = this.course.modules.findIndex(m => m.id === moduleId);
    if (idx === -1) return;
    this.course.modules[idx].lessons = lessons.map((l, i) => ({ ...l, order: i }));
    this.course.totalDuration = calculateTotalDuration(this.course.modules);
    this.courseBuilderService.reorderLessons(this.courseId, this.tenantId, moduleId, lessons.map(l => l.id)).pipe(takeUntil(this.destroy$)).subscribe({ error: () => { this.toastService.error('Failed to save order'); this.loadCourse(); } });
  }
  onToggleFree(isFree: boolean): void { if (!this.course) return; this.course.isFree = isFree; if (isFree) this.course.price = 0; this.saveCourse(); }
  onPriceChange(): void { this.saveCourse(); }
  async onToggleVisibility(): Promise<void> {
    if (!this.course) return;
    const pub = !this.course.isPublic;
    if (await this.confirmDialog.confirm(`Make Course ${pub ? 'Public' : 'Private'}`, `Make this course ${pub ? 'public' : 'private'}?`)) {
      this.course.isPublic = pub; this.saveCourse(); this.toastService.success(`Course is now ${pub ? 'public' : 'private'}`);
    }
  }
  onEditCourseInfo(): void { this.activeTab = 'settings'; }
  onSaveCourseInfo(data: Partial<CourseBuilderData>): void { if (!this.course) return; this.course = { ...this.course, ...data }; this.saveCourse(); }
  async onPublish(): Promise<void> {
    if (!this.course) return;
    if (this.course.modules.length === 0) { this.toastService.error('Must have at least one module'); return; }
    if (!this.course.modules.some(m => m.lessons.length > 0)) { this.toastService.error('Must have at least one lesson'); return; }
    const shouldPublish = this.course.status !== 'published';
    if (!await this.confirmDialog.confirm(`${shouldPublish ? 'Publish' : 'Unpublish'} Course`, `${shouldPublish ? 'Publish' : 'Unpublish'} "${this.course.title}"?`)) return;
    this.isSaving = true;
    this.courseBuilderService.publishCourse(this.courseId, this.tenantId, shouldPublish).pipe(takeUntil(this.destroy$)).subscribe({
      next: (u) => { this.course!.status = u.status; this.isSaving = false; this.toastService.success(`Course ${shouldPublish ? 'publish' : 'unpublish'}ed`); },
      error: () => { this.isSaving = false; this.toastService.error('Failed to update publish status'); },
    });
  }
  saveCourse(): void {
    if (!this.course) return;
    this.isSaving = true;
    this.course.totalLessons = calculateTotalLessons(this.course.modules);
    this.course.totalDuration = calculateTotalDuration(this.course.modules);
    if (!this.course.courseCode) this.course.courseCode = generateCourseCode(this.course.title);
    const data = {
      title: this.course.title, description: this.course.description, category: this.course.category, level: this.course.level,
      thumbnailUrl: this.course.thumbnailUrl, courseCode: this.course.courseCode,
      modules: this.course.modules.map(m => ({ id: m.id, title: m.title, description: m.description, order: m.order, lessons: m.lessons.map(l => ({ id: l.id, title: l.title, type: l.type, duration: l.duration, content: l.content, order: l.order })) })),
      duration: this.course.totalDuration, isPublic: this.course.isPublic, isFree: this.course.isFree, price: this.course.price, currency: this.course.currency || 'USD',
      instructorBio: this.course.instructorBio, hasCertificate: this.course.hasCertificate, hasBadges: this.course.hasBadges, hasLifetimeAccess: this.course.hasLifetimeAccess,
    };
    this.courseBuilderService.updateCourse(this.courseId, this.tenantId, data).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.isSaving = false; },
      error: () => { this.isSaving = false; this.toastService.error('Failed to save changes'); },
    });
  }
  goBack(): void { this.router.navigate(['/teacher/courses']); }
  openBulkUploadModal(): void { this.showBulkUploadModal = true; }
  closeBulkUploadModal(): void { this.showBulkUploadModal = false; }
  onBulkUpload(modules: Module[]): void {
    if (!this.course) return;
    const start = this.course.modules.length;
    this.course.modules = [...this.course.modules, ...modules.map((m, i) => ({ ...m, order: start + i }))];
    this.course.totalLessons = calculateTotalLessons(this.course.modules);
    this.course.totalDuration = calculateTotalDuration(this.course.modules);
    this.closeBulkUploadModal(); this.saveCourse(); this.toastService.success(`Imported ${modules.length} module(s)`);
  }
  onTabChange(tab: TabType): void {
    this.activeTab = tab;
    if (tab === 'students' && this.enrolledStudents.length === 0) this.loadEnrolledStudents();
  }
  loadEnrolledStudents(): void {
    if (!this.course) return;
    this.isLoadingStudents = true;
    this.courseBuilderService.getEnrolledStudents(this.courseId, this.tenantId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (s) => { this.enrolledStudents = s; this.isLoadingStudents = false; },
      error: () => { this.isLoadingStudents = false; },
    });
  }
  get filteredStudents(): EnrolledStudent[] {
    if (!this.studentSearchQuery.trim()) return this.enrolledStudents;
    const q = this.studentSearchQuery.toLowerCase();
    return this.enrolledStudents.filter(s => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }
  async onUnenrollStudent(student: EnrolledStudent): Promise<void> {
    if (!await this.confirmDialog.confirm('Unenroll Student', `Unenroll ${student.fullName}?`)) return;
    this.courseBuilderService.unenrollStudent(this.courseId, this.tenantId, student.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.enrolledStudents = this.enrolledStudents.filter(s => s.id !== student.id);
        if (this.course) this.course.enrolledStudents = Math.max(0, this.course.enrolledStudents - 1);
        this.toastService.success(`${student.fullName} unenrolled`);
      },
      error: () => { this.toastService.error('Failed to unenroll'); },
    });
  }
  formatDate(dateString: string): string { return dateString ? new Date(dateString).toLocaleDateString() : 'N/A'; }
}