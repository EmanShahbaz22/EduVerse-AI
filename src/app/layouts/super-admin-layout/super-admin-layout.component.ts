import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-super-admin-layout',
  imports: [CommonModule, SidebarComponent, RouterOutlet],
  templateUrl: './super-admin-layout.component.html',
  styleUrl: './super-admin-layout.component.css',
})
export class SuperAdminLayoutComponent {
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
