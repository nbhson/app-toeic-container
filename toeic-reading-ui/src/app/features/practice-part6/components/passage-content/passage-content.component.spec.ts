import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PassageContentComponent } from './passage-content.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { ToeicPart6Passage } from '../../../../core/models/toeic.model';

const mockPassage: ToeicPart6Passage = {
  id: 'p1',
  text: 'This is a [1] passage with a [2] gap.',
  translation: 'Đây là một đoạn văn có chỗ trống.',
  questions: [
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
  ],
};

describe('PassageContentComponent', () => {
  let component: PassageContentComponent;
  let fixture: ComponentFixture<PassageContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassageContentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PassageContentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('passage', mockPassage);
    fixture.componentRef.setInput('selectedAnswers', {});
    fixture.componentRef.setInput('isSubmitted', false);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize showTranslation as false', () => {
    expect(component.showTranslation()).toBe(false);
  });

  describe('toggleTranslation', () => {
    it('should toggle showTranslation value', () => {
      expect(component.showTranslation()).toBe(false);
      component.toggleTranslation();
      expect(component.showTranslation()).toBe(true);
      component.toggleTranslation();
      expect(component.showTranslation()).toBe(false);
    });
  });

  describe('getPassageSegments', () => {
    it('should split text by gap markers', () => {
      const segments = component.getPassageSegments('Text [1] more [2] end');
      expect(segments).toEqual(['Text ', '[1]', ' more ', '[2]', ' end']);
    });

    it('should return empty array for empty text', () => {
      expect(component.getPassageSegments('')).toEqual([]);
      expect(component.getPassageSegments(null as unknown as string)).toEqual([]);
    });

    it('should return single segment when no gaps', () => {
      expect(component.getPassageSegments('Plain text')).toEqual(['Plain text']);
    });
  });

  describe('isGapMarker', () => {
    it('should return true for gap markers', () => {
      expect(component.isGapMarker('[1]')).toBe(true);
      expect(component.isGapMarker('[2]')).toBe(true);
    });

    it('should return false for non-gap text', () => {
      expect(component.isGapMarker('Text ')).toBe(false);
      expect(component.isGapMarker(']')).toBe(false);
    });
  });

  describe('getGapNumber', () => {
    it('should extract the gap number', () => {
      expect(component.getGapNumber('[1]')).toBe(1);
      expect(component.getGapNumber('[2]')).toBe(2);
      expect(component.getGapNumber('[10]')).toBe(10);
    });
  });

  describe('hasAnsweredGap', () => {
    it('should return true when gap has been answered', () => {
      fixture.componentRef.setInput('selectedAnswers', { q1: 0 });
      fixture.detectChanges();
      expect(component.hasAnsweredGap(1)).toBe(true);
    });

    it('should return false when gap has not been answered', () => {
      fixture.componentRef.setInput('selectedAnswers', {});
      fixture.detectChanges();
      expect(component.hasAnsweredGap(1)).toBe(false);
    });

    it('should return false when question id not found for gap', () => {
      fixture.componentRef.setInput('selectedAnswers', { q1: 0 });
      fixture.detectChanges();
      expect(component.hasAnsweredGap(99)).toBe(false);
    });
  });

  describe('isGapCorrect', () => {
    it('should return true when selected answer matches correct answer', () => {
      fixture.componentRef.setInput('selectedAnswers', { q1: 0 }); // correctAnswer is 0
      fixture.detectChanges();
      expect(component.isGapCorrect(1)).toBe(true);
    });

    it('should return false when selected answer is incorrect', () => {
      fixture.componentRef.setInput('selectedAnswers', { q2: 0 }); // correctAnswer is 2
      fixture.detectChanges();
      expect(component.isGapCorrect(2)).toBe(false);
    });

    it('should return false when gap has no matching question', () => {
      expect(component.isGapCorrect(99)).toBe(false);
    });
  });

  describe('onGapClick', () => {
    it('should emit gapClicked with the gap number', () => {
      let emittedNumber: number | undefined;
      component.gapClicked.subscribe((num: number) => (emittedNumber = num));
      component.onGapClick(3);
      expect(emittedNumber).toBe(3);
    });
  });
});