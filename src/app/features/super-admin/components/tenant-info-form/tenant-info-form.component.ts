import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ChangePasswordComponent } from '../../../../shared/components/change-password/change-password.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  SubscriptionPlan,
  SubscriptionPlanService,
} from '../../services/subscription-plan.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-tenant-info-form',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ChangePasswordComponent, ReactiveFormsModule],
  templateUrl: './tenant-info-form.component.html',
  styleUrl: './tenant-info-form.component.css'
})
export class TenantInfoFormComponent {
  @Input() tenant: any = null;
  @Output() save = new EventEmitter<any>();

  form!: FormGroup;
  showChangePassword = false;
  availablePlans: SubscriptionPlan[] = [];
  loadingPlans = false;

  constructor(
    private fb: FormBuilder,
    private subscriptionPlanService: SubscriptionPlanService,
    private toastService: ToastService,
  ) {
    this.form = this.fb.group({
      tenantName: ['', Validators.required],
      adminEmail: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      contactNumber: ['', Validators.required],
      address: [''],
      subscriptionPlanCode: [''],
      subscriptionCategory: ['free', Validators.required],
      subscriptionPlan: [''],
      subscriptionBillingCycle: ['monthly'],
      subscriptionPriceMonthly: [0],
      subscriptionStartDate: [''],
      subscriptionExpiryDate: [''],
      subscriptionNotes: [''],
    });

    this.loadPlanTemplates();
  }

  private toDateInput(value: any): string {
    if (!value) return '';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toISOString().slice(0, 10);
  }

  ngOnChanges(): void {
    if (this.tenant) {
      const details = this.tenant.subscriptionDetails || {};
      this.form.patchValue({
        tenantName: this.tenant.name || '',
        adminEmail: this.tenant.adminEmail || '',
        contactNumber: this.tenant.contactNumber || '',
        address: this.tenant.address || '',
        subscriptionPlanCode: this.tenant.subscriptionPlan || '',
        subscriptionCategory:
          this.tenant.subscriptionCategory ||
          details.category ||
          'free',
        subscriptionPlan:
          this.tenant.subscriptionPlan ||
          details.plan ||
          '',
        subscriptionBillingCycle:
          this.tenant.subscriptionBillingCycle ||
          details.billingCycle ||
          'monthly',
        subscriptionPriceMonthly:
          this.tenant.subscriptionPriceMonthly ??
          details.pricePerMonth ??
          0,
        subscriptionStartDate: this.toDateInput(
          this.tenant.subscriptionStartDate || details.startDate,
        ),
        subscriptionExpiryDate: this.toDateInput(
          this.tenant.subscriptionExpiryDate || details.expiryDate,
        ),
        subscriptionNotes:
          this.tenant.subscriptionNotes ||
          details.notes ||
          '',
      });
    }
  }

  private loadPlanTemplates(): void {
    this.loadingPlans = true;
    this.subscriptionPlanService.getPlans('active').subscribe({
      next: (plans) => {
        this.availablePlans = plans;
        this.loadingPlans = false;
      },
      error: (err) => {
        this.loadingPlans = false;
        this.toastService.error(
          getApiErrorMessage(err, 'Unable to load subscription plan templates.'),
        );
      },
    });
  }

  onPlanTemplateChange(event: Event): void {
    const selectedCode = (event.target as HTMLSelectElement).value;
    if (!selectedCode) {
      this.form.patchValue({ subscriptionPlanCode: '' });
      return;
    }

    const selected = this.availablePlans.find((plan) => plan.code === selectedCode);
    if (!selected) return;

    this.form.patchValue({
      subscriptionPlanCode: selected.code,
      subscriptionPlan: selected.code,
      subscriptionCategory: selected.category,
      subscriptionBillingCycle: selected.billingCycle,
      subscriptionPriceMonthly: selected.pricePerMonth,
    });
  }

  toggleChangePassword() {
    this.showChangePassword = !this.showChangePassword;
  }

  onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const payload = {
      ...this.tenant,
      ...rawValue,
      subscriptionPlan: rawValue.subscriptionPlanCode || rawValue.subscriptionPlan || '',
    };
    this.save.emit(payload);
  }

  onPasswordChanged(event: any) {

  }
}
