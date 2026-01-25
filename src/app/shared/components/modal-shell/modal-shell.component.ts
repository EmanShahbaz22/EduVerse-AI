import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-shell.component.html',
  styleUrl: './modal-shell.component.css',
})
export class ModalShellComponent {
  @Input() show = false;
  @Input() title = '';
  @Input() actionLabel = 'Submit';
  @Input() isFormValid = true;

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
