import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/constants/api.constants';

export interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
}

export interface Quiz {
    id: string;
    courseId: string;
    quizNumber: number;
    description?: string;
    questions: QuizQuestion[];
    totalMarks: number;
    timeLimitMinutes?: number;
}

@Injectable({
    providedIn: 'root'
})
export class QuizService {
    private baseUrl = `${API_BASE_URL}/quizzes`;

    constructor(private http: HttpClient) { }

    getQuizById(quizId: string): Observable<Quiz> {
        return this.http.get<Quiz>(`${this.baseUrl}/${quizId}`);
    }
}
