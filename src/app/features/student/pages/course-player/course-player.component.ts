import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { StudentProgressService, CourseProgress } from '../../services/student-progress.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { QuizService, Quiz } from '../../services/quiz.service';

interface ChatMessage { sender: 'AI' | 'Student'; text: string; time: Date; }

@Component({
    selector: 'app-course-player',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent],
    templateUrl: './course-player.component.html',
    styleUrls: ['./course-player.component.css']
})
export class CoursePlayerComponent implements OnInit, OnDestroy {
    courseId = '';
    course: BackendCourse | null = null;
    progress: CourseProgress | null = null;
    loading = true;
    activeLesson: any = null;
    activeModuleIndex = 0;
    allLessons: any[] = [];
    videoUrl: SafeResourceUrl | null = null;
    activeQuiz: Quiz | null = null;
    quizAnswers: string[] = [];
    quizScore = 0;
    quizSubmitted = false;
    loadingQuiz = false;
    isSidebarOpen = true;
    userNotes = '';
    isSavingNotes = false;
    chatInput = '';
    chatMessages: ChatMessage[] = [
        { sender: 'AI', text: 'Hello! I am your AI study assistant. How can I help you with this course today?', time: new Date() }
    ];

    constructor(
        private route: ActivatedRoute, private router: Router,
        private courseService: CourseService, private authService: AuthService,
        private progressService: StudentProgressService,
        private quizService: QuizService, private sanitizer: DomSanitizer,
    ) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.courseId = params.get('id') || '';
            if (this.courseId) this.loadCourseAndProgress();
        });
    }

    ngOnDestroy() { }

    loadCourseAndProgress() {
        const user = this.authService.getUser();
        const tenantId = this.authService.getTenantId();
        const scopedTenantId = user?.role === 'student' ? undefined : (tenantId ?? undefined);
        if (user?.role !== 'student' && !tenantId) {
            this.loading = false;
            return;
        }
        const saved = localStorage.getItem(`notes_${this.courseId}`);
        if (saved) this.userNotes = saved;
        this.courseService.getCourseById(this.courseId, scopedTenantId).subscribe({
            next: (course) => {
                this.course = course;
                this.flattenLessons();
                const progressTenantId = tenantId || course.tenantId;
                if (progressTenantId) {
                    this.loadProgress(progressTenantId);
                } else {
                    this.loading = false;
                }
                if (course.modules?.[0]?.lessons?.[0]) this.selectLesson(course.modules[0].lessons[0], 0);
            },
            error: () => { this.loading = false; },
        });
    }

    flattenLessons() {
        this.allLessons = [];
        this.course?.modules?.forEach((mod, mIdx) => {
            mod.lessons?.forEach((l: any) => this.allLessons.push({ ...l, moduleIndex: mIdx }));
        });
    }

    loadProgress(tenantId: string) {
        this.progressService.getCourseProgress(this.courseId, tenantId).subscribe({
            next: (p) => { this.progress = p; this.loading = false; },
            error: () => { this.loading = false; },
        });
    }

    selectLesson(lesson: any, moduleIndex: number) {
        this.activeLesson = lesson;
        this.activeModuleIndex = moduleIndex;
        this.quizSubmitted = false;
        this.activeQuiz = null;
        this.videoUrl = (lesson.type === 'video' && lesson.content) ? this.getSafeVideoUrl(lesson.content) : null;
        if (lesson.type === 'quiz' && lesson.content) this.loadQuiz(lesson.content);
        document.querySelector('main')?.scrollTo(0, 0);
    }

    loadQuiz(quizId: string) {
        this.loadingQuiz = true;
        this.quizService.getQuizById(quizId).subscribe({
            next: (quiz) => { this.activeQuiz = quiz; this.quizAnswers = new Array(quiz.questions.length).fill(''); this.loadingQuiz = false; },
            error: () => { this.loadingQuiz = false; },
        });
    }

    submitQuiz() {
        if (!this.activeQuiz) return;
        let correct = 0;
        this.activeQuiz.questions.forEach((q, i) => { if (this.quizAnswers[i] === q.answer) correct++; });
        this.quizScore = Math.round((correct / this.activeQuiz.questions.length) * 100);
        this.quizSubmitted = true;
        if (this.quizScore >= 70) this.markComplete();
    }

    getSafeVideoUrl(url: string): SafeResourceUrl {
        if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
        const ALLOWED = ['youtube.com', 'www.youtube.com', 'youtu.be', 'vimeo.com', 'player.vimeo.com'];
        try { if (!ALLOWED.includes(new URL(url).hostname)) return this.sanitizer.bypassSecurityTrustResourceUrl(''); }
        catch { return this.sanitizer.bypassSecurityTrustResourceUrl(''); }
        let embed = url;
        if (url.includes('youtube.com/watch?v=')) embed = url.replace('watch?v=', 'embed/');
        else if (url.includes('youtu.be/')) embed = url.replace('youtu.be/', 'youtube.com/embed/');
        return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
    }

    lessonsMatch(l1: any, l2: any): boolean { return l1 && l2 && (l1.id || l1._id) === (l2.id || l2._id); }
    isLessonCompleted(lessonId: string): boolean { return this.progress?.completedLessons.includes(lessonId) || false; }

    markComplete() {
        if (!this.activeLesson) return;
        const lessonId = this.activeLesson.id || this.activeLesson._id;
        const tenantId = this.authService.getTenantId() || this.course?.tenantId;
        if (!tenantId || !lessonId) return;
        this.progressService.markLessonComplete(this.courseId, lessonId, tenantId).subscribe({
            next: (p) => { this.progress = p; },
            error: () => { },
        });
    }

    saveNotes() {
        this.isSavingNotes = true;
        localStorage.setItem(`notes_${this.courseId}`, this.userNotes);
        setTimeout(() => { this.isSavingNotes = false; }, 800);
    }

    sendChatMessage() {
        if (!this.chatInput.trim()) return;
        this.chatMessages.push({ sender: 'Student', text: this.chatInput, time: new Date() });
        const input = this.chatInput.toLowerCase();
        this.chatInput = '';
        setTimeout(() => {
            const resp = (input.includes('explain') || input.includes('help'))
                ? `I'd be happy to explain. Which part of ${this.activeLesson?.title || 'the lesson'} should we focus on?`
                : "That's a great question. How can I clarify it further?";
            this.chatMessages.push({ sender: 'AI', text: resp, time: new Date() });
        }, 1000);
    }

    private findCurrentIndex(): number { return this.allLessons.findIndex(l => this.lessonsMatch(l, this.activeLesson)); }
    nextLesson() { const i = this.findCurrentIndex(); if (i !== -1 && i < this.allLessons.length - 1) { const n = this.allLessons[i + 1]; this.selectLesson(n, n.moduleIndex); } }
    previousLesson() { const i = this.findCurrentIndex(); if (i > 0) { const p = this.allLessons[i - 1]; this.selectLesson(p, p.moduleIndex); } }
    hasNextLesson(): boolean { const i = this.findCurrentIndex(); return i !== -1 && i < this.allLessons.length - 1; }
    hasPreviousLesson(): boolean { return this.findCurrentIndex() > 0; }
    toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; }
    goBack() { this.router.navigate(['/student/courses']); }
}
