import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-account-actions',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './account-actions.component.html',
  styleUrl: './account-actions.component.css'
})
export class AccountActionsComponent {
  @Output() deactivate = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  confirmDeactivate() {
    if (confirm(`Are you sure you want to deactivate this tenant? This will block access for all of their users.`)) {
      this.deactivate.emit();
    }
  }

  confirmDelete() {
    if (confirm(`Are you sure you want to delete this tenant? This is irreversible.`)) {
      this.delete.emit();
    }
  }
}
