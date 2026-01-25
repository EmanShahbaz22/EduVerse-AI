import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from "../button/button.component";

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {
  /** Current page → which page button should be highlighted. */
  @Input() currentPage = 1;

  /** Total items */
  @Input() totalItems = 0;

  /** Items per page */
  @Input() pageSize = 10; /** totalItems + pageSize → how many pages exist in total. */

  /** Emit new page when changed → emits when the user clicks Prev/Next or a page number. */
  @Output() pageChange = new EventEmitter<number>();

  /** Total number of pages */
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  /** Change page safely */
  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;

    this.pageChange.emit(page);
  }

  get pages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const visible: number[] = [];

    // Always show current, prev and next
    const start = Math.max(1, current - 1);
    const end = Math.min(total, current + 1);

    for (let i = start; i <= end; i++) {
      visible.push(i);
    }

    return visible;
  }


}
