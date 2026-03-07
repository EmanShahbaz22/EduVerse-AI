import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import {
  SubscriptionPlan,
  SubscriptionPlanPayload,
  SubscriptionPlanService,
} from '../../services/subscription-plan.service';

@Component({
  selector: 'app-super-admin-subscription-plans',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './super-admin-subscription-plans.component.html',
  styleUrl: './super-admin-subscription-plans.component.css',
})
export class SuperAdminSubscriptionPlansComponent implements OnInit {
  plans: SubscriptionPlan[] = [];
  loading = false;
  saving = false;
  deletingPlanId: string | null = null;

  editorOpen = false;
  editingPlan: SubscriptionPlan | null = null;

  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  planForm!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private planService: SubscriptionPlanService,
    private toastService: ToastService,
  ) {
    this.planForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadPlans();
  }

  private createForm() {
    return this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['custom', [Validators.required]],
      billingCycle: ['monthly', [Validators.required]],
      pricePerMonth: [0, [Validators.required, Validators.min(0)]],
      maxStudents: [null as number | null],
      maxTeachers: [null as number | null],
      maxCourses: [null as number | null],
      aiCredits: [null as number | null],
      storageGb: [null as number | null],
      status: ['active', [Validators.required]],
      description: [''],
      featuresText: [''],
    });
  }

  get filteredPlans(): SubscriptionPlan[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.plans.filter((plan) => {
      const statusMatch =
        this.statusFilter === 'all' || plan.status === this.statusFilter;
      if (!statusMatch) return false;
      if (!query) return true;
      return (
        plan.name.toLowerCase().includes(query) ||
        plan.code.toLowerCase().includes(query) ||
        plan.category.toLowerCase().includes(query)
      );
    });
  }

  loadPlans(): void {
    this.loading = true;
    this.planService.getPlans().subscribe({
      next: (plans) => {
        this.plans = plans;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(
          getApiErrorMessage(err, 'Unable to load subscription plans.'),
        );
      },
    });
  }

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value || '';
  }

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as
      | 'all'
      | 'active'
      | 'inactive';
    this.statusFilter = value || 'all';
  }

  openCreate(): void {
    this.editorOpen = true;
    this.editingPlan = null;
    this.planForm.reset({
      code: '',
      name: '',
      category: 'custom',
      billingCycle: 'monthly',
      pricePerMonth: 0,
      maxStudents: null,
      maxTeachers: null,
      maxCourses: null,
      aiCredits: null,
      storageGb: null,
      status: 'active',
      description: '',
      featuresText: '',
    });
  }

  openEdit(plan: SubscriptionPlan): void {
    this.editorOpen = true;
    this.editingPlan = plan;
    this.planForm.reset({
      code: plan.code,
      name: plan.name,
      category: plan.category,
      billingCycle: plan.billingCycle,
      pricePerMonth: plan.pricePerMonth,
      maxStudents: plan.maxStudents ?? null,
      maxTeachers: plan.maxTeachers ?? null,
      maxCourses: plan.maxCourses ?? null,
      aiCredits: plan.aiCredits ?? null,
      storageGb: plan.storageGb ?? null,
      status: plan.status,
      description: plan.description ?? '',
      featuresText: (plan.features || []).join('\n'),
    });
  }

  closeEditor(): void {
    this.editorOpen = false;
    this.editingPlan = null;
  }

  private toNullableNumber(raw: unknown): number | null {
    if (raw === null || raw === undefined || raw === '') return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  private buildPayload(): SubscriptionPlanPayload {
    const raw = this.planForm.getRawValue();
    const features = (raw.featuresText || '')
      .split('\n')
      .map((item: string) => item.trim())
      .filter(Boolean);

    return {
      code: (raw.code || '').trim(),
      name: (raw.name || '').trim(),
      category: (raw.category || 'custom').trim().toLowerCase(),
      billingCycle: (raw.billingCycle || 'monthly') as
        | 'monthly'
        | 'quarterly'
        | 'yearly',
      pricePerMonth: Number(raw.pricePerMonth || 0),
      maxStudents: this.toNullableNumber(raw.maxStudents),
      maxTeachers: this.toNullableNumber(raw.maxTeachers),
      maxCourses: this.toNullableNumber(raw.maxCourses),
      aiCredits: this.toNullableNumber(raw.aiCredits),
      storageGb: this.toNullableNumber(raw.storageGb),
      description: (raw.description || '').trim() || null,
      features,
      status: (raw.status || 'active') as 'active' | 'inactive',
    };
  }

  onSubmit(): void {
    if (this.saving) return;
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.saving = true;

    const req$ = this.editingPlan
      ? this.planService.updatePlan(this.editingPlan.id, payload)
      : this.planService.createPlan(payload);

    req$.subscribe({
      next: (plan) => {
        this.saving = false;
        if (this.editingPlan) {
          const idx = this.plans.findIndex((x) => x.id === this.editingPlan?.id);
          if (idx >= 0) this.plans[idx] = plan;
          this.toastService.success('Subscription plan updated successfully.');
        } else {
          this.plans.unshift(plan);
          this.toastService.success('Subscription plan created successfully.');
        }
        this.closeEditor();
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(
          getApiErrorMessage(err, 'Failed to save subscription plan.'),
        );
      },
    });
  }

  onDelete(plan: SubscriptionPlan): void {
    if (this.deletingPlanId) return;
    if (!confirm(`Delete plan "${plan.name}"?`)) return;

    this.deletingPlanId = plan.id;
    this.planService.deletePlan(plan.id).subscribe({
      next: () => {
        this.deletingPlanId = null;
        this.plans = this.plans.filter((x) => x.id !== plan.id);
        this.toastService.success('Subscription plan deleted successfully.');
      },
      error: (err) => {
        this.deletingPlanId = null;
        this.toastService.error(
          getApiErrorMessage(err, 'Failed to delete subscription plan.'),
        );
      },
    });
  }
}
