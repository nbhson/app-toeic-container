import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionListComponent } from './question-list.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { ToeicPart7Question } from '../../../../core/models/toeic.model';

const mockQuestions: ToeicPart7Question[] = [
  {
    id: 'q1',
    questionNumber: 1,
    question: 'What is the main topic?',
    options: ['Topic A', 'Topic B', 'Topic C', 'Topic D'],
    correctAnswer: 0,
    explanation: 'Explanation 1',
    translation: 'Translation 1',
  },
  {
    id: 'q2',
    questionNumber: 2,
    question: 'Who is the sender?',
    options: ['Person A', 'Person B', 'Person C', 'Person D'],
    correctAnswer: 2,
    explanation: 'Explanation 2',
    translation: 'Translation 2',
  },
];

describe('QuestionListComponent', () => {
  let component: QuestionListComponent;
  let fixture: ComponentFixture<QuestionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('questions', mockQuestions);
    fixture.componentRef.setInput('selectedAnswers', {});
    fixture.componentRef.setInput('isSubmitted', false);
    fixture.componentRef.setInput('currentPassageId', 'p1');
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should get correct option letter', () => {
    expect(component.getOptionLetter(0)).toBe('A');
    expect(component.getOptionLetter(1)).toBe('B');
    expect(component.getOptionLetter(2)).toBe('C');
    expect(component.getOptionLetter(3)).toBe('D');
  });

  describe('onOptionClick', () => {
    it('should emit selectOption with questionId and optionIdx', () => {
      let emitted: { questionId: string; optionIdx: number } | undefined;
      component.selectOption.subscribe((e) => (emitted = e));
      component.onOptionClick('q1', 3);
      expect(emitted).toEqual({ questionId: 'q1', optionIdx: 3 });
    });
  });
});