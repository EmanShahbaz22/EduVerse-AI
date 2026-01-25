import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface NotificationItem {
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  icon: string; // e.g. 'fa-solid fa-book'
  iconBgClass: string; // Tailwind background class for icon circle
  iconColorClass: string; // Tailwind color for icon
  bgClass: string; // NEW: background color for the whole notification
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent {
  notifications: NotificationItem[] = [
    {
      type: 'info',
      title: 'New Assignment Posted',
      message:
        'A new assignment for Advanced Mathematics has been posted. Due: Oct 25.',
      icon: 'fa-solid fa-book',
      iconBgClass: 'bg-blue-200',
      iconColorClass: 'text-blue-600',
      bgClass: 'bg-blue-50', // light background for the whole card
    },
    {
      type: 'warning',
      title: 'Deadline Approaching',
      message: 'Your project for "History of Art" is due in 3 days.',
      icon: 'fa-solid fa-clock',
      iconBgClass: 'bg-red-200',
      iconColorClass: 'text-red-600',
      bgClass: 'bg-red-50',
    },
    {
      type: 'success',
      title: 'New Announcement',
      message: 'Campus will be closed for the upcoming holiday on Monday.',
      icon: 'fa-solid fa-bullhorn',
      iconBgClass: 'bg-green-200',
      iconColorClass: 'text-green-600',
      bgClass: 'bg-green-50',
    },
  ];
}
