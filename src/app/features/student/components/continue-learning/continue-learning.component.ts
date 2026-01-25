import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface Course {
  title: string;
  lesson: string;
  progress: number; // completion percentage (0–100)
}

@Component({
  selector: 'app-continue-learning',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './continue-learning.component.html',
  styleUrls: ['./continue-learning.component.css'],
})
export class ContinueLearningComponent {
  courses: Course[] = [
    {
      title: 'Advanced Mathematics',
      lesson: 'Lesson 4 of 10 • Algebraic Structures',
      progress: 40,
    },
    {
      title: 'Computer Networks',
      lesson: 'Lesson 7 of 12 • IP Addressing',
      progress: 60,
    },
    // {
    //   title: 'History of Art',
    //   lesson: 'Lesson 2 of 8 • Renaissance Art',
    //   progress: 25,
    // },
  ];
}
