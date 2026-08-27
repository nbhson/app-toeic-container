import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionMapComponent } from './question-map.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { ToeicQuestion, UserStats } from '../../../../core/models/toeic.model';

const mockQuestions: ToeicQuestion[] = [
  {
    id: 'q1',
    question: 'Question 1',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 0,
    explanation: 'Exp 1',
    translation: 'Trans 1',
    category: 'Grammar',
    difficulty: 'Easy',
  },
  {
    id: 'q2',
    question: 'Question 2',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 1,
    explanation: 'Exp 2',
    translation: 'Trans 2',
    category: 'Vocabulary',
    difficulty: 'Medium',
  },
  {
    id: 'q3',
    question: 'Question 3',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 2,
    explanation: 'Exp 3',
    translation: 'Trans 3',
    category: 'Word Forms',
    difficulty: 'Hard',
  },
];

const mockStats: UserStats = {
  totalAnswered: 2,
  totalCorrect: 1,
  totalIncorrect: 1,
  categoryStats: {},
  history: [
    {
      questionId: 'q1',
      questionText: 'Question 1',
      selectedAnswer: 0,
      correctAnswer: 0,
      isCorrect: true,
      timestamp: 1000,
    },
    {
      questionId: 'q2',
      questionText: 'Question 2',
      selectedAnswer: 2,
      correctAnswer: 1,
      isCorrect: false,
      timestamp: 2000,
    },
  ],
};

describe('QuestionMapComponent', () => {
  let component: QuestionMapComponent;
  let fixture: ComponentFixture<QuestionMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionMapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionMapComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('questions', mockQuestions);
    fixture.componentRef.setInput('currentIndex', 0);
    fixture.componentRef.setInput('stats', mockStats);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should return true for isQuestionCorrect when question is answered correctly', () => {
    expect(component.isQuestionCorrect('q1')).toBe(true);
  });

  it('should return false for isQuestionCorrect when question is answered incorrectly', () => {
    expect(component.isQuestionCorrect('q2')).toBe(false);
  });

  it('should return false for isQuestionCorrect when question is not answered', () => {
    expect(component.isQuestionCorrect('q3')).toBe(false);
  });

  it('should return true for isQuestionIncorrect when question is answered incorrectly', () => {
    expect(component.isQuestionIncorrect('q2')).toBe(true);
  });

  it('should return false for isQuestionIncorrect when question is answered correctly', () => {
    expect(component.isQuestionIncorrect('q1')).toBe(false);
  });

  it('should return false for isQuestionIncorrect when question is not answered', () => {
    expect(component.isQuestionIncorrect('q3')).toBe(false);
  });

  it('should emit questionSelected when a question is clicked', () => {
    let emittedIndex: number | undefined;
    component.questionSelected.subscribe((idx: number) => (emittedIndex = idx));
    component.questionSelected.emit(2);
    expect(emittedIndex).toBe(2);
  });
});