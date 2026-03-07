import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import { PaymentService } from '../../services/payment.service';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';

@Component({
    selector: 'app-payment-modal',
    standalone: true,
    imports: [CommonModule, ButtonComponent],
    templateUrl: './payment-modal.component.html',
    styles: [`:host { display: contents; }`]
})
export class PaymentModalComponent implements AfterViewInit, OnDestroy {
    @Input() courseId: string = '';
    @Input() courseTitle: string = '';
    @Input() price: number = 0;
    @Input() currency: string = 'USD';

    @Output() cancel = new EventEmitter<void>();

    @ViewChild('cardElement') cardElementRef!: ElementRef;

    isProcessing = false;
    isLoadingStripe = true;
    errorMessage = '';
    paymentComplete = false;

    private stripe: Stripe | null = null;
    private elements: StripeElements | null = null;
    private card: StripeCardElement | null = null;
    private clientSecret = '';

    constructor(
        private paymentService: PaymentService,
        private router: Router,
        private ngZone: NgZone,
    ) {}

    ngAfterViewInit() {
        this.initStripe();
    }

    ngOnDestroy() {
        this.card?.destroy();
    }

    private initStripe() {
        // 1. Fetch publishable key from backend .env
        this.paymentService.getStripeConfig().subscribe({
            next: (config) => {
                if (!config.publishableKey) {
                    this.errorMessage = 'Payment configuration error. Contact support.';
                    this.isLoadingStripe = false;
                    return;
                }
                this.loadStripeAndIntent(config.publishableKey);
            },
            error: () => {
                this.errorMessage = 'Failed to load payment config.';
                this.isLoadingStripe = false;
            },
        });
    }

    private async loadStripeAndIntent(publishableKey: string) {
        // 2. Load Stripe.js
        this.stripe = await loadStripe(publishableKey);
        if (!this.stripe) {
            this.ngZone.run(() => {
                this.errorMessage = 'Failed to load payment provider.';
                this.isLoadingStripe = false;
            });
            return;
        }

        // 3. Create PaymentIntent on backend.
        // Student identity/tenant are derived server-side.
        this.paymentService.createPaymentIntent(this.courseId).subscribe({
            next: (res) => {
                this.clientSecret = res.clientSecret;
                this.mountCardElement();
            },
            error: (err: any) => {
                this.errorMessage = getApiErrorMessage(err, 'Failed to initialize payment.');
                this.isLoadingStripe = false;
            },
        });
    }

    private mountCardElement() {
        if (!this.stripe) return;

        this.elements = this.stripe.elements();
        this.card = this.elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#1e293b',
                    fontFamily: '"Inter", system-ui, sans-serif',
                    '::placeholder': { color: '#94a3b8' },
                },
                invalid: { color: '#ef4444' },
            },
        });

        this.card.mount(this.cardElementRef.nativeElement);

        this.card.on('change', (event: any) => {
            this.ngZone.run(() => {
                this.errorMessage = event.error ? event.error.message : '';
            });
        });

        this.isLoadingStripe = false;
    }

    async onPay() {
        if (!this.stripe || !this.card || !this.clientSecret) return;

        this.isProcessing = true;
        this.errorMessage = '';

        const { error, paymentIntent } = await this.stripe.confirmCardPayment(
            this.clientSecret,
            { payment_method: { card: this.card } },
        );

        if (error) {
            this.ngZone.run(() => {
                this.isProcessing = false;
                this.errorMessage = error.message || 'Payment failed. Please try again.';
            });
            return;
        }

        if (paymentIntent?.status === 'succeeded') {
            // Confirm on backend → triggers enrollment
            this.paymentService.confirmPayment(paymentIntent.id).subscribe({
                next: () => {
                    this.ngZone.run(() => {
                        this.isProcessing = false;
                        this.paymentComplete = true;
                    });
                },
                error: () => {
                    this.ngZone.run(() => {
                        this.isProcessing = false;
                        this.paymentComplete = true; // Payment succeeded, enrollment will happen via webhook
                    });
                },
            });
        }
    }

    goToCourse() {
        this.router.navigate(['/student/learn', this.courseId]);
    }

    onCancel() {
        if (!this.isProcessing) {
            this.cancel.emit();
        }
    }
}
