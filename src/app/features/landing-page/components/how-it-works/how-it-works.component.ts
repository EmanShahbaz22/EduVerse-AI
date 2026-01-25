import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../section-title/section-title.component';
import { CardComponent } from '../card/card.component';

interface Step {
  number: number;
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, SectionTitleComponent, CardComponent],
  templateUrl: './how-it-works.component.html'
})
export class HowItWorksComponent {
  steps: Step[] = [
    {
      number: 1,
      icon: '🏫',
      title: 'Register Institution',
      description: 'Create your branded learning environment with custom colors, logo, and domain settings in minutes.'
    },
    {
      number: 2,
      icon: '📚',
      title: 'Create Courses',
      description: 'Upload content, organize lessons, and let AI assist with quiz generation and learning paths.'
    },
    {
      number: 3,
      icon: '👥',
      title: 'Invite Users',
      description: 'Add teachers and students with role-based access and customized permissions for each group.'
    },
    {
      number: 4,
      icon: '📊',
      title: 'Track Progress',
      description: 'Monitor engagement, analyze performance, and get AI-powered insights to improve outcomes.'
    }
  ];
}
