import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReadingTestComponent } from './reading-test.component';
import { ToeicService } from '../../core/services/toeic.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserStats } from '../../core/models/toeic.model';
import { signal } from '@angular/core';

const createMockStats = (): UserStats => ({
  totalAnswered: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  categoryStats: {},
  history: [],
});

describe('ReadingTestComponent', () => {
  let component: ReadingTestComponent;
  let fixture: ComponentFixture<ReadingTestComponent>;

  beforeEach(async () => {
    const mockStats = signal(createMockStats());
    const toeicServiceMock: Partial<ToeicService> = {
      stats: mockStats as unknown as ReturnType<typeof signal<UserStats>>,
      showSettingsModal: signal(false) as unknown as ReturnType<typeof signal<boolean>>,
      getReadingTestConfig: vi.fn().mockResolvedValue({ totalQuestions: 100, timeLimitMinutes: 75, parts: [] }),
      loadPracticeQuestions: vi.fn().mockResolvedValue([]),
      loadPart6Passages: vi.fn().mockResolvedValue([]),
      loadPart7Passages: vi.fn().mockResolvedValue([]),
      getQuestionById: vi.fn(),
      saveAnswer: vi.fn(),
      scoreReadingTest: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReadingTestComponent],
      providers: [{ provide: ToeicService, useValue: toeicServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReadingTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should select options only before submit', () => {
    component.select('q1', 2);
    expect(component.selected()['q1']).toBe(2);
    component.isSubmitted.set(true);
    component.select('q1', 0);
    expect(component.selected()['q1']).toBe(2);
  });

  it('should toggle flags only before submit', () => {
    component.toggleFlag('q1');
    expect(component.flagged()['q1']).toBe(true);
    component.toggleFlag('q1');
    expect(component.flagged()['q1']).toBe(false);
    component.isSubmitted.set(true);
    component.toggleFlag('q1');
    expect(component.flagged()['q1']).toBe(false);
  });

  it('should build a flat question index across parts', () => {
    component.part5.set([
      { id: 'p5-1', question: 'Q?', options: [], correctAnswer: 0, explanation: '', translation: '', category: 'Grammar', difficulty: 'Easy' },
    ]);
    component.part7.set([
      {
        id: 'p7-1',
        passageType: 'Single',
        documentType: 'Email',
        text: 't',
        translation: 'tr',
        questions: [
          { id: 'p7-q1', questionNumber: 147, question: 'Q?', options: [], correctAnswer: 0, explanation: '', translation: '' },
        ],
      },
    ]);
    const index = component.questionIndex();
    expect(index).toHaveLength(2);
    expect(index[0]).toEqual({ id: 'p5-1', number: 101, part: 5 });
    expect(index[1]).toEqual({ id: 'p7-q1', number: 147, part: 7 });
  });

  it('should ask for confirmation before submitting with unanswered questions', () => {
    component.phase.set('testing');
    // 1 question total, 0 answered → confirm modal must open, not submit
    component.part5.set([
      { id: 'p5-1', question: 'Q?', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, explanation: '', translation: '', category: 'Grammar', difficulty: 'Easy' },
    ]);
    component.submit();
    expect(component.showConfirmSubmitModal()).toBe(true);
    expect(component.isSubmitted()).toBe(false);
  });

  it('should compute trend bar heights with a visible floor', () => {
    expect(component.trendHeight(495)).toBe(100);
    expect(component.trendHeight(0)).toBeGreaterThan(0);
  });
});
