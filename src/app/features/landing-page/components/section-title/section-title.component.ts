import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-title',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Render the title with dynamic classes -->
    <h2 [class]="titleClasses">
      {{ title }}
    </h2>
  `
})
export class SectionTitleComponent {
  // The actual text for the title 
  @Input() title = '';

  
  @Input() color: 'dark' | 'light' | 'blue' = 'dark';

 
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  // Compute Tailwind classes dynamically based on inputs
  get titleClasses(): string {
    // Base styling shared by all titles
    const baseClasses = 'text-center font-bold mb-12 font-poppins fade-in';
    
    // Colors that can be applied depending on "color" input
    const colorClasses = {
      dark: 'text-text-dark',
      light: 'text-text-light',
      blue: 'text-primary-light-blue'
    };

    // Sizes that can be applied depending on "size" input
    const sizeClasses = {
      sm: 'text-3xl',
      md: 'text-4xl',
      lg: 'text-5xl'
    };

    // Return a combined class string
    return `${baseClasses} ${colorClasses[this.color]} ${sizeClasses[this.size]}`;
  }
}
