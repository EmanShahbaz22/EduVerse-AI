import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html'
})
export class CardComponent {
  // it is for changed layout and spacing
  @Input() type: 'default' | 'feature' | 'tenant' | 'step' = 'default';

  // it is if hover animation is enabled or not
  @Input() hover = true;

  
  @Input() background: 'light' | 'dark' = 'light';

  
  @Input() class = '';

  // If true, forces equal height for grid alignment means content is less or more height should remain same
  @Input() equalHeight = false;

  
  get cardClasses(): string {
    const baseClasses = 'rounded-2xl transition-all duration-300';
    
    const typeClasses = {
      default: 'p-8 shadow-lg',
      feature: 'overflow-hidden shadow-lg border border-border-light',
      tenant: 'p-6 text-center shadow-sm border border-border-light',
      step: 'p-8 text-center relative'
    };

    const backgroundClasses = {
      light: 'bg-white',
      dark: 'bg-primary-navy'
    };

    const hoverClasses = this.hover ? 'hover:-translate-y-1 hover:shadow-xl' : '';

    // Apply equal height if enabled so that all cards are of equal size chahy content zyada h ya km
    const heightClasses = this.equalHeight ? 'h-full flex flex-col' : '';

    return `${baseClasses} ${typeClasses[this.type]} ${backgroundClasses[this.background]} ${hoverClasses} ${heightClasses} ${this.class}`;
  }
}
