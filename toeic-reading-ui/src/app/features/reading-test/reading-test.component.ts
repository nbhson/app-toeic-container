import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { ToeicService } from '../../core/services/toeic.service';
import {
  ToeicQuestion,
  ToeicPart6Passage,
  ToeicPart7Passage,
  TestResultSummary,
} from '../../core/models/toeic.model';
import { HasPendingChanges } from '../../core/guards/pending-changes.guard';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

interface ScoreResult {
  correct: number;
  total: number;
  percent: number;
  score: number;
  level: string;
}

interface PaletteEntry {
  id: string;
  number: number;
  part: number;
}

type Phase = 'setup' | 'loading' | 'testing' | 'result';

@Component({
  selector: 'app-reading-test',
  standalone: true,
  imports: [ConfirmModalComponent],
  templateUrl: './reading-test.component.html',
  styleUrl: './reading-test.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadingTestComponent implements HasPendingChanges, OnDestroy {
  private readonly toeicService = inject(ToeicService);

  readonly phase = signal<Phase>('setup');
  readonly errorMessage = signal<string | null>(null);
  readonly timeLimitMinutes = signal<number>(75);
  readonly remainingSeconds = signal<number>(75 * 60);
  readonly isSubmitted = signal<boolean>(false);
  readonly score = signal<ScoreResult | null>(null);

  readonly part5 = signal<ToeicQuestion[]>([]);
  readonly part6 = signal<ToeicPart6Passage[]>([]);
  readonly part7 = signal<ToeicPart7Passage[]>([]);

  /** questionId -> selected option index */
  readonly selected = signal<Record<string, number>>({});

  /** questionId -> flagged for review */
  readonly flagged = signal<Record<string, boolean>>({});

  /** Server-side history of completed tests (for the score trend). */
  readonly historyResults = signal<TestResultSummary[]>([]);
  readonly historySaveFailed = signal<boolean>(false);

  showConfirmLeaveModal = signal<boolean>(false);
  showConfirmSubmitModal = signal<boolean>(false);
  private resolveLeave: ((value: boolean) => void) | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;

  /** Absolute deadline (ms epoch) — the countdown is derived from it so the
   * timer never drifts, even when the tab is throttled in the background. */
  private endTime = 0;

  readonly timeDisplay = computed(() => {
    const s = Math.max(0, this.remainingSeconds());
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  });

  readonly totalQuestions = computed(
    () =>
      this.part5().length +
      this.part6().reduce((n, p) => n + p.questions.length, 0) +
      this.part7().reduce((n, p) => n + p.questions.length, 0),
  );

  readonly answeredCount = computed(() => Object.keys(this.selected()).length);

  readonly flaggedCount = computed(
    () => Object.values(this.flagged()).filter(Boolean).length,
  );

  /** Flat, ordered question index powering the navigator palette. */
  readonly questionIndex = computed<PaletteEntry[]>(() => {
    const entries: PaletteEntry[] = [];
    this.part5().forEach((q, i) => entries.push({ id: q.id, number: 101 + i, part: 5 }));
    this.part6().forEach((p) =>
      p.questions.forEach((q) => entries.push({ id: q.id, number: q.questionNumber, part: 6 })),
    );
    this.part7().forEach((p) =>
      p.questions.forEach((q) => entries.push({ id: q.id, number: q.questionNumber, part: 7 })),
    );
    return entries;
  });

  /** Last 10 completed tests (newest last) for the mini score trend. */
  readonly scoreTrend = computed(() => this.historyResults().slice(-10));

  readonly partScores = computed(() => {
    if (!this.isSubmitted()) return null;
    const sel = this.selected();
    const count = (ids: string[]) =>
      ids.reduce(
        (acc, id) => {
          const q = this.toeicService.getQuestionById(id) as any;
          if (!q) return acc;
          acc.total += 1;
          if (sel[id] === q.correctAnswer) acc.correct += 1;
          return acc;
        },
        { correct: 0, total: 0 },
      );
    return {
      part5: count(this.part5().map((q) => q.id)),
      part6: count(this.part6().flatMap((p) => p.questions.map((q) => q.id))),
      part7: count(this.part7().flatMap((p) => p.questions.map((q) => q.id))),
    };
  });

  openSettings() {
    this.toeicService.showSettingsModal.set(true);
  }

  async start() {
    this.errorMessage.set(null);
    try {
      const config = await this.toeicService.getReadingTestConfig();
      this.timeLimitMinutes.set(config.timeLimitMinutes);
    } catch {
      // keep defaults
    }
    this.phase.set('loading');
    try {
      const [p5, p6, p7] = await Promise.all([
        this.toeicService.loadPracticeQuestions(30),
        this.toeicService.loadPart6Passages(4),
        this.toeicService.loadPart7Passages(true),
      ]);
      this.part5.set(p5);
      this.part6.set(p6);
      this.part7.set(p7);
      this.selected.set({});
      this.flagged.set({});
      this.isSubmitted.set(false);
      this.score.set(null);
      this.historyResults.set([]);
      this.remainingSeconds.set(this.timeLimitMinutes() * 60);
      this.phase.set('testing');
      this.startTimer();
    } catch (error: any) {
      this.errorMessage.set(error?.message || 'Không tải được đề thi, vui lòng thử lại.');
      this.phase.set('setup');
    }
  }

  select(questionId: string, optionIndex: number) {
    if (this.isSubmitted()) return;
    this.selected.update((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  toggleFlag(questionId: string) {
    if (this.isSubmitted()) return;
    this.flagged.update((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  }

  /** "Nộp bài" click: when unanswered questions remain, confirm via modal. */
  submit() {
    if (this.phase() !== 'testing' || this.isSubmitted()) return;
    const unanswered = this.totalQuestions() - this.answeredCount();
    if (unanswered > 0) {
      this.showConfirmSubmitModal.set(true);
      return;
    }
    this.finalizeSubmission();
  }

  onSubmitModalResponse(accept: boolean) {
    this.showConfirmSubmitModal.set(false);
    if (accept) {
      this.finalizeSubmission();
    }
  }

  private finalizeSubmission() {
    if (this.phase() !== 'testing' || this.isSubmitted()) return;
    this.stopTimer();
    const answers: Array<{ selectedAnswer: number; correctAnswer: number }> = [];
    const push = (id: string) => {
      const q = this.toeicService.getQuestionById(id) as any;
      if (!q) return;
      const sel = this.selected()[id] ?? -1;
      if (sel >= 0) this.toeicService.saveAnswer(id, sel);
      answers.push({ selectedAnswer: sel, correctAnswer: q.correctAnswer });
    };
    this.part5().forEach((q) => push(q.id));
    this.part6().forEach((p) => p.questions.forEach((q) => push(q.id)));
    this.part7().forEach((p) => p.questions.forEach((q) => push(q.id)));
    this.isSubmitted.set(true);
    this.toeicService
      .scoreReadingTest(answers)
      .then(async (r) => {
        this.score.set(r);
        await this.recordHistory(r);
      })
      .catch(async () => {
        // BE scorer unreachable: score locally, still record the attempt.
        const correct = answers.filter((a) => a.selectedAnswer === a.correctAnswer).length;
        this.score.set({
          correct,
          total: answers.length,
          percent: answers.length ? Math.round((correct / answers.length) * 1000) / 10 : 0,
          score: 0,
          level: 'Không chấm được điểm online — xem số câu đúng ở trên.',
        });
        await this.recordHistory(this.score()!);
      });
    this.phase.set('result');
  }

  /** Persists the finished test to the server-side history (best effort). */
  private async recordHistory(score: ScoreResult) {
    const partScores = this.partScores();
    const updated = await this.toeicService.saveTestResult({
      takenAt: Date.now(),
      score: score.score,
      correct: score.correct,
      total: score.total,
      percent: score.percent,
      level: score.level,
      partScores: partScores
        ? { part5: partScores.part5, part6: partScores.part6, part7: partScores.part7 }
        : undefined,
    });
    if (updated === null) {
      this.historySaveFailed.set(true);
      return;
    }
    this.historySaveFailed.set(false);
    this.historyResults.set(updated);
  }

  restart() {
    this.stopTimer();
    this.phase.set('setup');
    this.part5.set([]);
    this.part6.set([]);
    this.part7.set([]);
    this.selected.set({});
    this.flagged.set({});
    this.isSubmitted.set(false);
    this.score.set(null);
    this.historyResults.set([]);
    this.historySaveFailed.set(false);
    this.errorMessage.set(null);
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  /** Bar height (%) for the score trend — floors tiny scores so they stay visible. */
  trendHeight(score: number): number {
    return Math.max(4, (score / 495) * 100);
  }

  /** Scrolls the viewport to a question from the navigator palette. */
  jumpTo(questionId: string) {
    document.getElementById(`q-${questionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private startTimer() {
    this.stopTimer();
    this.endTime = Date.now() + this.remainingSeconds() * 1000;
    this.timerId = setInterval(() => {
      // Always derive remaining time from the absolute deadline — a plain
      // per-tick countdown drifts when the tab is throttled in the background.
      const left = Math.max(0, Math.round((this.endTime - Date.now()) / 1000));
      this.remainingSeconds.set(left);
      if (left <= 0) {
        this.stopTimer();
        this.finalizeSubmission(); // auto-submit: no confirmation needed
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.hasUnsavedProgress()) {
      $event.returnValue = true;
    }
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    // Re-sync the countdown instantly when the user returns to the tab.
    if (document.visibilityState === 'visible' && this.phase() === 'testing' && !this.isSubmitted()) {
      this.remainingSeconds.set(Math.max(0, Math.round((this.endTime - Date.now()) / 1000)));
    }
  }

  hasUnsavedProgress(): boolean {
    return this.phase() === 'testing' && !this.isSubmitted();
  }

  confirmLeave(): Promise<boolean> | boolean {
    if (!this.hasUnsavedProgress()) return true;
    this.showConfirmLeaveModal.set(true);
    return new Promise<boolean>((resolve) => {
      this.resolveLeave = resolve;
    });
  }

  onConfirmLeaveResponse(accept: boolean) {
    this.showConfirmLeaveModal.set(false);
    if (this.resolveLeave) {
      this.resolveLeave(accept);
      this.resolveLeave = null;
    }
  }
}
