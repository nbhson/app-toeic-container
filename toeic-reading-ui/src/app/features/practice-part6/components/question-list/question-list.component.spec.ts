import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionListComponent } from './question-list.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { ToeicPart6Question } from '../../../../core/models/toeic.model';

const mockQuestions: ToeicPart6Question[] = [
  {
    id: 'q1',
    questionNumber: 1,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 0,
    explanation: 'Explanation 1',
    category: 'Grammar',
  },
  {
    id: 'q2',
    questionNumber: 2,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 2,
    explanation: 'Explanation 2',
    category: 'Vocabulary',
  },
  {
    id: 'q3',
    questionNumber: 3,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 1,
    explanation: 'Explanation 3',
    category: 'Word Forms',
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

  describe('getCategoryBadgeClass', () => {
    it('should return badge-grammar for Grammar category', () => {
      expect(component.getCategoryBadgeClass('Grammar')).toBe('badge-grammar');
    });

    it('should return badge-vocabulary for Vocabulary category', () => {
      expect(component.getCategoryBadgeClass('Vocabulary')).toBe('badge-vocabulary');
    });

    it('should return badge-wordform for Word Forms category', () => {
      expect(component.getCategoryBadgeClass('Word Forms')).toBe('badge-wordform');
    });

    it('should return badge-sentence-insertion for Sentence Insertion category', () => {
      expect(component.getCategoryBadgeClass('Sentence Insertion')).toBe('badge-sentence-insertion');
    });

    it('should return badge-grammar as default', () => {
      expect(component.getCategoryBadgeClass('Unknown')).toBe('badge-grammar');
    });
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