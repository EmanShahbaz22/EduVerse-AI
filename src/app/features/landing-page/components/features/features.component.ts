import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../section-title/section-title.component';
import { CardComponent } from '../card/card.component';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, SectionTitleComponent, CardComponent],
  templateUrl: './features.component.html'
})
export class FeaturesComponent {
  features: Feature[] = [
    {
      icon: '🏢',
      title: 'Multi-Tenant Architecture',
      description: 'Support unlimited institutions with separate branding, user management, and complete data isolation.'
    },
    {
      icon: '🤖',
      title: 'AI Learning Assistant',
      description: 'Powered by LangChain and LLMs for personalized tutoring and adaptive content generation.'
    },
    {
      icon: '👥',
      title: 'Role-Based Access',
      description: 'Seamless management for Admins, Teachers, and Students with customized dashboards.'
    },
    {
      icon: '📊',
      title: 'Advanced Analytics',
      description: 'Real-time progress tracking and performance insights with AI-powered recommendations.'
    },
    {
      icon: '🎯',
      title: 'Adaptive Assessments',
      description: 'AI-generated quizzes that adapt to learner performance with SCORM compliance.'
    },
    {
      icon: '☁️',
      title: 'Cloud-Native',
      description: 'Built on AWS with auto-scaling, high availability, and global content delivery.'
    }
  ];
}
