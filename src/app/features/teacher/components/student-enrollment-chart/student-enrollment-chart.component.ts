import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-student-enrollment-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './student-enrollment-chart.component.html',
  styleUrls: ['./student-enrollment-chart.component.css']
})
export class StudentEnrollmentChartComponent {
  subjects = ['Math101', 'HistoryT201', 'CS101', 'English'];
  enrollments = [25, 22, 20, 30];

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.subjects,
    datasets: [
      {
        label: 'Enrolled Students',
        data: this.enrollments,
        backgroundColor: ['#6366f1', '#22c55e', '#f97316', '#ef4444'],
        borderRadius: 6,
      },
    ],
  };
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: '#1e3a8a' },
      },
    },
    scales: {
      x: {
        ticks: { color: '#1e3a8a' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#1e3a8a' },
      },
    },
  };
}
