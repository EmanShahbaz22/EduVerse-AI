import { Component, HostListener } from '@angular/core';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-layout',
  imports: [SidebarComponent, RouterOutlet, CommonModule],
  templateUrl: './student-layout.component.html',
  styleUrl: './student-layout.component.css',
})
export class StudentLayoutComponent {
  isSidebarOpen = true;
  isMobile = false;

  constructor() {
    this.updateScreenSize();
  }

  @HostListener('window:resize')
  updateScreenSize() {
    this.isMobile = window.innerWidth < 992;
  }

  onSidebarToggle(isOpen: boolean) {
    this.isSidebarOpen = isOpen;
  }
}
