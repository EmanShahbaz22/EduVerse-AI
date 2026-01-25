import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-student-details',
  standalone: true,
  imports: [HeaderComponent, CommonModule, DataTableComponent],
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.css'],
})
export class StudentDetailsComponent implements OnInit {
  studentId: number | null = null;
  student: any;

  // Columns for tables
  quizColumns: TableColumn[] = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'scoreDisplay', label: 'Score', type: 'text' },
  ];

  assignmentColumns: TableColumn[] = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'scoreDisplay', label: 'Score', type: 'text' },
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadStudentData();
  }

  loadStudentData() {
    const allStudents = [
      {
        id: 1,
        name: 'John Doe',
        course: 'Introduction to Algebra',
        quizzes: [
          { title: 'Quiz 1', score: 9, total: 10 },
          { title: 'Quiz 2', score: 8, total: 10 },
        ],
        assignments: [
          { title: 'Assignment 1', score: 18, total: 20 },
          { title: 'Assignment 2', score: 20, total: 20 },
        ],
      },
      {
        id: 2,
        name: 'Jane Smith',
        course: 'World History',
        quizzes: [
          { title: 'Quiz 1', score: 6, total: 10 },
          { title: 'Quiz 2', score: 5, total: 10 },
        ],
        assignments: [
          { title: 'Assignment 1', score: 14, total: 20 },
          { title: 'Assignment 2', score: 15, total: 20 },
        ],
      },
      {
        id: 3,
        name: 'Mike Johnson',
        course: 'Physics 101',
        quizzes: [
          { title: 'Quiz 1', score: 10, total: 10 },
          { title: 'Quiz 2', score: 9, total: 10 },
        ],
        assignments: [
          { title: 'Assignment 1', score: 20, total: 20 },
          { title: 'Assignment 2', score: 19, total: 20 },
        ],
      },
      {
        id: 4,
        name: 'Emily Davis',
        course: 'Introduction to Algebra',
        quizzes: [
          { title: 'Quiz 1', score: 4, total: 10 },
          { title: 'Quiz 2', score: 5, total: 10 },
        ],
        assignments: [
          { title: 'Assignment 1', score: 10, total: 20 },
          { title: 'Assignment 2', score: 8, total: 20 },
        ],
      },
    ];

    const selected = allStudents.find((s) => s.id === this.studentId);

    if (selected) {
      // Add scoreDisplay for each quiz/assignment
      selected.quizzes = selected.quizzes.map((q) => ({
        ...q,
        scoreDisplay: `${q.score}/${q.total}`,
      }));
      selected.assignments = selected.assignments.map((a) => ({
        ...a,
        scoreDisplay: `${a.score}/${a.total}`,
      }));
    }

    this.student = selected;
  }

  // Navigate back to Track Student page
 goBack() {
  this.router.navigate(['/teacher/trackstudent']); 
}
}
