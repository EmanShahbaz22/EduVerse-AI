import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Course } from '../../../../shared/models/course.model';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-quiz.component.html',
  styleUrls: ['./create-quiz.component.css'],
})
export class CreateQuizComponent implements OnInit {
  @Input() quiz: any = null;
  @Input() courses: Course[] = [];
  @Input() hasSubmissions = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  quizForm!: FormGroup;
  isEditMode = false;
  isDisabled = false;
  questionsLocked = false;
  isSaving = false;
  originalFormValue: any = null;
  optionLetters = ['a', 'b', 'c', 'd'];

  constructor(private fb: FormBuilder, private toastService: ToastService) { }

  ngOnInit(): void {
    this.initForm();
    if (this.quiz) {
      this.isEditMode = true;
      this.questionsLocked = this.hasSubmissions;
      this.populateFormWithQuizData(this.quiz);
      if (this.questionsLocked) this.disableLockedFields();
    }
  }

  disableLockedFields(): void {
    this.quizForm.get('courseId')?.disable();
    const qa = this.quizForm.get('questions') as FormArray;
    qa.controls.forEach(qg => {
      qg.get('statement')?.disable();
      qg.get('correctAnswer')?.disable();
      (qg.get('options') as FormArray).controls.forEach(o => o.disable());
    });
  }

  initForm(): void {
    this.quizForm = this.fb.group({
      id: [null], quizNo: ['', Validators.required], course: [''],
      courseId: ['', Validators.required], dueDate: ['', Validators.required],
      description: [''], questions: this.fb.array([this.createQuestionGroup()]), status: ['Active'],
    });
  }

  createQuestionGroup(): FormGroup {
    return this.fb.group({
      statement: ['', Validators.required],
      options: this.fb.array([this.fb.control('', Validators.required), this.fb.control('', Validators.required)]),
      correctAnswer: ['', Validators.required],
    });
  }

  get questions(): FormArray { return this.quizForm.get('questions') as FormArray; }
  getOptions(i: number): FormArray { return this.questions.at(i).get('options') as FormArray; }
  getOptionLetter(index: number): string { return this.optionLetters[index] || ''; }

  addOption(qi: number): void { const o = this.getOptions(qi); if (o.length < 4) o.push(this.fb.control('', Validators.required)); }

  removeOption(qi: number, oi: number): void {
    const o = this.getOptions(qi);
    if (o.length > 2) {
      o.removeAt(oi);
      const ca = this.questions.at(qi).get('correctAnswer');
      if (this.optionLetters.indexOf(ca?.value) >= o.length) ca?.setValue('');
    }
  }

  getAvailableOptions(qi: number): string[] { return this.optionLetters.slice(0, this.getOptions(qi).length); }
  addQuestion(): void { this.questions.push(this.createQuestionGroup()); }
  removeQuestion(index: number): void { this.questions.removeAt(index); }

  onCourseChange(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const c = this.courses.find(x => x.id === id);
    if (c) this.quizForm.patchValue({ course: c.title, courseId: c.id });
  }

  populateFormWithQuizData(data: any): void {
    this.quizForm.patchValue({
      id: data.id, quizNo: data.quizNo, course: data.course,
      courseId: data.courseId || '', dueDate: this.formatDate(data.dueDate),
      description: data.description, status: data.status,
    });
    const qa = this.quizForm.get('questions') as FormArray;
    qa.clear();
    data.questions.forEach((q: any) => {
      const idx = q.options.findIndex((o: string) => o === q.correctAnswer);
      qa.push(this.fb.group({
        statement: [q.statement, Validators.required],
        options: this.fb.array(q.options.map((o: string) => this.fb.control(o, Validators.required))),
        correctAnswer: [idx >= 0 ? this.optionLetters[idx] : '', Validators.required],
      }));
    });
    if (data.status === 'Inactive') { this.quizForm.disable(); this.isDisabled = true; }
    else { this.quizForm.enable(); this.isDisabled = false; }
    this.originalFormValue = JSON.parse(JSON.stringify(this.quizForm.getRawValue()));
  }

  formatDate(date: any): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
  }

  hasFormChanged(): boolean {
    if (!this.originalFormValue) return true;
    return JSON.stringify(this.quizForm.getRawValue()) !== JSON.stringify(this.originalFormValue);
  }

  closeModal(): void { this.close.emit(); }

  saveQuiz(): void {
    if (this.quizForm.invalid) { this.toastService.warning('Please fill all required fields.'); return; }
    if (this.isEditMode && !this.hasFormChanged()) { this.toastService.info('No changes detected.'); return; }
    if (this.isSaving) return;
    this.isSaving = true;
    const val = this.quizForm.getRawValue();
    val.questions = val.questions.map((q: any) => {
      const i = this.optionLetters.indexOf(q.correctAnswer);
      return { ...q, correctAnswer: i >= 0 && i < q.options.length ? q.options[i] : q.correctAnswer };
    });
    this.save.emit(val);
  }

  resetSaving(): void { this.isSaving = false; }
}
