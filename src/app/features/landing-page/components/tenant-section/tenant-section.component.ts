import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../section-title/section-title.component';
import { CardComponent } from '../card/card.component';

// Defining the structure of a Tenant 
interface TenantType {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-tenant-section',
  standalone: true,
  imports: [CommonModule, SectionTitleComponent, CardComponent],
  templateUrl: './tenant-section.component.html'
})
export class TenantSectionComponent {
  // List of different types of institutions that my platform supports
  tenants: TenantType[] = [
    {
      icon: '🎓',
      title: 'Universities',
      description: 'Scale learning for thousands of students with comprehensive course management and detailed analytics.'
    },
    {
      icon: '🏫',
      title: 'Schools',
      description: 'Enhance K-12 education with interactive content and parent engagement tools.'
    },
    {
      icon: '🏢',
      title: 'Enterprises',
      description: 'Deliver corporate training programs with certification tracking and skill assessments.'
    },
    {
      icon: '🎯',
      title: 'Coaching Centers',
      description: 'Personalize learning paths with AI-powered recommendations and progress tracking.'
    }
  ];
}
