import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FooterSection {
  title: string;
  links: { label: string; href: string }[];
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  footerSections: FooterSection[] = [
    {
      title: 'Platform',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'AI Demo', href: '#demo' },
        { label: 'Pricing', href: '#' },
        { label: 'API Documentation', href: '#' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '#' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Support', href: '#' }
      ]
    },
    {
      title: 'Contact',
      links: [
        { label: 'Sales Inquiry', href: '#' },
        { label: 'Technical Support', href: '#' },
        { label: 'Partner Program', href: '#' },
        { label: 'Community', href: '#' }
      ]
    }
  ];

  currentYear = new Date().getFullYear();
}
