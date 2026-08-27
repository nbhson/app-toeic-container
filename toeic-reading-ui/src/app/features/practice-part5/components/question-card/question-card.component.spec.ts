import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionCardComponent } from './question-card.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { ToeicQuestion } from '../../../../core/models/toeic.model';

const mockQuestion: ToeicQuestion = {
  id: 'q1',
  question: 'Test question?',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correctAnswer: 1,
  explanation: 'Test explanation',
  translation: 'Test translation',
  category: 'Grammar',
  difficulty: 'Medium',
};

describe('QuestionCardComponent', () => {
  let component: QuestionCardComponent;
  let fixture: ComponentFixture<QuestionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionCardComponent);
    component = fixture.componentInstance;
    // Set required inputs before first detectChanges
    fixture.componentRef.setInput('question', mockQuestion);
    fixture.componentRef.setInput('currentIndex', 0);
    fixture.componentRef.setInput('totalQuestions', 10);
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

  describe('with input values set', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('currentIndex', 0);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();
    });

    it('should display the question text', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Test question?');
    });

    it('should display options', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Option A');
      expect(compiled.textContent).toContain('Option D');
    });

    it('should emit optionSelected output', () => {
      let emittedIndex: number | undefined;
      component.optionSelected.subscribe((idx: number) => (emittedIndex = idx));
      component.optionSelected.emit(2);
      expect(emittedIndex).toBe(2);
    });

    it('should emit answerSubmitted output', () => {
      let emitted = false;
      component.answerSubmitted.subscribe(() => (emitted = true));
      component.answerSubmitted.emit();
      expect(emitted).toBe(true);
    });

    it('should emit prevPressed output', () => {
      let emitted = false;
      component.prevPressed.subscribe(() => (emitted = true));
      component.prevPressed.emit();
      expect(emitted).toBe(true);
    });

    it('should emit nextPressed output', () => {
      let emitted = false;
      component.nextPressed.subscribe(() => (emitted = true));
      component.nextPressed.emit();
      expect(emitted).toBe(true);
    });
  });
});