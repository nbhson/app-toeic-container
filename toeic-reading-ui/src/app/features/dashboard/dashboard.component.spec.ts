import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { ToeicService } from '../../core/services/toeic.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserStats } from '../../core/models/toeic.model';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

const createMockStats = (overrides: Partial<UserStats> = {}): UserStats => ({
  totalAnswered: 10,
  totalCorrect: 7,
  totalIncorrect: 3,
  categoryStats: {
    Grammar: { answered: 4, correct: 3 },
    Vocabulary: { answered: 3, correct: 2 },
    'Word Forms': { answered: 3, correct: 2 },
    'Sentence Insertion': { answered: 5, correct: 4 },
    'Single Passage': { answered: 6, correct: 5 },
    'Double Passage': { answered: 4, correct: 3 },
    'Triple Passage': { answered: 3, correct: 2 },
  },
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
      selectedAnswer: 1,
      correctAnswer: 0,
      isCorrect: false,
      timestamp: 2000,
    },
    {
      questionId: 'q3',
      questionText: 'Question 3',
      selectedAnswer: 2,
      correctAnswer: 2,
      isCorrect: true,
      timestamp: 3000,
    },
    {
      questionId: 'q4',
      questionText: 'Question 4',
      selectedAnswer: 1,
      correctAnswer: 1,
      isCorrect: true,
      timestamp: 4000,
    },
    {
      questionId: 'q5',
      questionText: 'Question 5',
      selectedAnswer: 3,
      correctAnswer: 2,
      isCorrect: false,
      timestamp: 5000,
    },
    {
      questionId: 'q6',
      questionText: 'Question 6',
      selectedAnswer: 0,
      correctAnswer: 0,
      isCorrect: true,
      timestamp: 6000,
    },
  ],
  ...overrides,
});

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let toeicServiceMock: Partial<ToeicService>;

  beforeEach(async () => {
    const mockStats = signal(createMockStats());

    toeicServiceMock = {
      stats: mockStats as unknown as ReturnType<typeof signal<UserStats>>,
      resetStats: vi.fn(),
      getReviewQueue: vi.fn().mockReturnValue([]),
      showSettingsModal: signal(false),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: ToeicService, useValue: toeicServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate overall accuracy correctly', () => {
    expect(component.accuracy()).toBe(70); // 7/10 = 70%
  });

  it('should calculate per-category accuracies via categoryRows', () => {
    const rows = component.categoryRows();
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
    expect(byKey['Grammar'].accuracy).toBe(75); // 3/4 = 75%
    expect(byKey['Vocabulary'].accuracy).toBe(67); // 2/3 ≈ 67%
    expect(byKey['Word Forms'].accuracy).toBe(67); // 2/3 ≈ 67%
    expect(byKey['Sentence Insertion'].accuracy).toBe(80); // 4/5 = 80%
    expect(byKey['Single Passage'].accuracy).toBe(83); // 5/6 ≈ 83%
    expect(byKey['Double Passage'].accuracy).toBe(75); // 3/4 = 75%
    expect(byKey['Triple Passage'].accuracy).toBe(67); // 2/3 ≈ 67%
    expect(byKey['Grammar'].answered).toBe(4);
    expect(byKey['Grammar'].correct).toBe(3);
  });

  it('should return 0 accuracy when no questions answered', () => {
    const emptyStats = signal(createMockStats({
      totalAnswered: 0,
      totalCorrect: 0,
      categoryStats: {
        Grammar: { answered: 0, correct: 0 },
        Vocabulary: { answered: 0, correct: 0 },
        'Word Forms': { answered: 0, correct: 0 },
        'Sentence Insertion': { answered: 0, correct: 0 },
        'Single Passage': { answered: 0, correct: 0 },
        'Double Passage': { answered: 0, correct: 0 },
        'Triple Passage': { answered: 0, correct: 0 },
      },
    }));

    (toeicServiceMock.stats as any).set(emptyStats());
    fixture.detectChanges();

    expect(component.accuracy()).toBe(0);
    expect(component.categoryRows().every((r) => r.accuracy === 0)).toBe(true);
  });

  it('should return 0 accuracies for missing category stats', () => {
    const statsWithoutCategories = signal(createMockStats({
      categoryStats: {} as any,
    }));
    (toeicServiceMock.stats as any).set(statsWithoutCategories());

    // Recreate component to pick up new initial stats
    const newFixture = TestBed.createComponent(DashboardComponent);
    const newComponent = newFixture.componentInstance;

    // Check computed signals without rendering template (which would crash on undefined categories)
    const rows = newComponent.categoryRows();
    expect(rows.length).toBe(7);
    expect(rows.every((r) => r.accuracy === 0 && r.answered === 0 && r.correct === 0)).toBe(true);
  });

  it('should return recent history sorted by timestamp descending (last 5)', () => {
    const history = component.recentHistory();
    expect(history.length).toBe(5);
    // Should be sorted descending: 6000, 5000, 4000, 3000, 2000
    expect(history[0].timestamp).toBe(6000);
    expect(history[1].timestamp).toBe(5000);
    expect(history[2].timestamp).toBe(4000);
    expect(history[3].timestamp).toBe(3000);
    expect(history[4].timestamp).toBe(2000);
  });

  it('should get correct option letter', () => {
    expect(component.getOptionLetter(0)).toBe('A');
    expect(component.getOptionLetter(1)).toBe('B');
    expect(component.getOptionLetter(2)).toBe('C');
    expect(component.getOptionLetter(3)).toBe('D');
  });

  it('should format date correctly', () => {
    // This is a simple format check - we can't test exact locale output deterministically
    const formatted = component.formatDate(0);
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  describe('resetData', () => {
    it('should call resetStats on ToeicService', () => {
      // Mock window.confirm to return true
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => true);

      component.resetData();
      expect(toeicServiceMock.resetStats).toHaveBeenCalled();

      window.confirm = originalConfirm;
    });

    it('should not call resetStats when confirm is cancelled', () => {
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => false);

      component.resetData();
      expect(toeicServiceMock.resetStats).not.toHaveBeenCalled();

      window.confirm = originalConfirm;
    });
  });
});