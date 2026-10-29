import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotebookComponent } from './notebook.component';
import { ToeicService } from '../../core/services/toeic.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserStats } from '../../core/models/toeic.model';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

const createMockStats = (history: UserStats['history']): UserStats => ({
  totalAnswered: 3,
  totalCorrect: 1,
  totalIncorrect: 2,
  categoryStats: {},
  history,
});

const entry = (
  questionId: string,
  questionText: string,
  selectedAnswer: number,
  correctAnswer: number,
  isCorrect: boolean,
  timestamp: number,
): UserStats['history'][number] => ({
  questionId,
  questionText,
  selectedAnswer,
  correctAnswer,
  isCorrect,
  timestamp,
});

describe('NotebookComponent', () => {
  let component: NotebookComponent;
  let fixture: ComponentFixture<NotebookComponent>;
  let setNotebookReviewed: ReturnType<typeof vi.fn>;
  let getNotebookReviewedIds: ReturnType<typeof vi.fn>;

  const setup = async (
    history: UserStats['history'],
    reviewedIds: string[] = [],
    questionById?: (id: string) => unknown,
  ) => {
    setNotebookReviewed = vi.fn();
    getNotebookReviewedIds = vi.fn().mockReturnValue(new Set(reviewedIds));
    const toeicServiceMock = {
      stats: signal(createMockStats(history)),
      getNotebookReviewedIds,
      setNotebookReviewed,
      getQuestionById: questionById ?? vi.fn().mockReturnValue(undefined),
      syncNotebookReviewed: vi.fn().mockResolvedValue(new Set(reviewedIds)),
      getBaseQuestionId: vi.fn((id: string) => id),
    } as unknown as ToeicService;

    await TestBed.configureTestingModule({
      imports: [NotebookComponent],
      providers: [
        { provide: ToeicService, useValue: toeicServiceMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotebookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should create the component', async () => {
    await setup([entry('q1', 'Question 1', 0, 1, false, 1000)]);
    expect(component).toBeTruthy();
  });

  it('keeps only wrong answers, latest attempt per question, newest first', async () => {
    await setup([
      entry('q1', 'Wrong q1', 0, 1, false, 1000),
      entry('q2', 'Right q2', 1, 1, true, 2000),
      entry('q1', 'Wrong q1 again', 2, 3, false, 3000),
    ]);
    const items = component.items();
    expect(items).toHaveLength(1);
    expect(items[0].questionId).toBe('q1');
    expect(items[0].selectedAnswer).toBe(2); // latest attempt
    expect(items[0].correctAnswer).toBe(3);
  });

  it('parses the part label and strips the prefix for Part 6/7 texts', async () => {
    await setup([
      entry('p6-1', 'Part 6 - Câu 131', 1, 0, false, 1000),
      entry('p5-1', 'Raw part 5 question', 1, 0, false, 2000),
    ]);
    const byId = Object.fromEntries(component.items().map((i) => [i.questionId, i]));
    expect(byId['p6-1'].partLabel).toBe('Part 6');
    expect(byId['p6-1'].questionBody).toBe('Câu 131');
    expect(byId['p5-1'].partLabel).toBe('Part 5');
    expect(byId['p5-1'].questionBody).toBe('Raw part 5 question');
  });

  it('toggles the reviewed state and persists it', async () => {
    await setup([entry('q1', 'Wrong q1', 0, 1, false, 1000)]);

    component.toggleReviewed('q1');
    expect(component.reviewedCount()).toBe(1);
    expect(component.pendingItems()).toHaveLength(0);
    expect(setNotebookReviewed).toHaveBeenCalledWith('q1', true);

    component.toggleReviewed('q1');
    expect(component.reviewedCount()).toBe(0);
    expect(component.pendingItems()).toHaveLength(1);
    expect(setNotebookReviewed).toHaveBeenLastCalledWith('q1', false);
  });

  it('clearReviewed resets every reviewed id', async () => {
    await setup(
      [
        entry('q1', 'Wrong q1', 0, 1, false, 1000),
        entry('q2', 'Wrong q2', 0, 1, false, 2000),
      ],
      ['q1', 'q2'],
    );
    expect(component.reviewedCount()).toBe(2);

    component.clearReviewed();
    expect(component.reviewedCount()).toBe(0);
    expect(setNotebookReviewed).toHaveBeenCalledWith('q1', false);
    expect(setNotebookReviewed).toHaveBeenCalledWith('q2', false);
  });

  it('shows the empty state when there are no wrong answers', async () => {
    await setup([entry('q1', 'Right q1', 0, 0, true, 1000)]);
    expect(component.items()).toHaveLength(0);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.nb-empty')).toBeTruthy();
  });

  it('pulls the explanation from the cached question when available', async () => {
    await setup([entry('q1', 'Wrong q1', 0, 1, false, 1000)], [], (id: string) =>
      id === 'q1' ? { id, correctAnswer: 1, explanation: 'Because of tense agreement.' } : undefined,
    );
    expect(component.items()[0].explanation).toBe('Because of tense agreement.');
  });

  it('syncs reviewed ids from the BE on init', async () => {
    const merged = new Set(['be-1', 'q1']);
    await setup([entry('q1', 'Wrong q1', 0, 1, false, 1000), entry('be-1', 'Wrong be-1', 0, 1, false, 2000)], ['q1']);
    const service = (component as any).toeicService as any;
    service.syncNotebookReviewed.mockResolvedValueOnce(merged);
    await component.ngOnInit();
    // The BE-merged set replaces the initial local one.
    expect(component.reviewedCount()).toBe(2);
  });

  it('builds deep-link query params from the stable base question id', async () => {
    await setup([entry('q1-session-1', 'Wrong q1', 0, 1, false, 1000)]);
    // Mock strips the session suffix like the real getBaseQuestionId.
    ((component as any).toeicService as any).getBaseQuestionId.mockImplementation(
      (id: string) => id.split('-session')[0],
    );
    const params = component.practiceQueryParams(component.items()[0]);
    expect(params['questionId']).toBe('q1');
  });
});
