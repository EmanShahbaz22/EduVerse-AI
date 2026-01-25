import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-progress-snapshot',
  imports: [CommonModule],
  templateUrl: './progress-snapshot.component.html',
  styleUrl: './progress-snapshot.component.css',
})
export class ProgressSnapshotComponent {
  progress = 75;
  streak = 12;
}
