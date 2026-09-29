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

  showConfirmLeaveModal = signal<boolean>(false);
  private resolveLeave: ((value: boolean) => void) | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;

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
      this.isSubmitted.set(false);
      this.score.set(null);
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

  submit(auto = false) {
    if (this.phase() !== 'testing' || this.isSubmitted()) return;
    const total = this.totalQuestions();
    const answered = this.answeredCount();
    if (!auto && answered < total) {
      const ok = confirm(
        `Bạn còn ${total - answered} câu chưa trả lời. Nộp bài và tính các câu này là sai?`,
      );
      if (!ok) return;
    }
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
      .then((r) => this.score.set(r))
      .catch(() => {
        const correct = answers.filter((a) => a.selectedAnswer === a.correctAnswer).length;
        this.score.set({
          correct,
          total: answers.length,
          percent: answers.length ? Math.round((correct / answers.length) * 1000) / 10 : 0,
          score: 0,
          level: 'Không chấm được điểm online — xem số câu đúng ở trên.',
        });
      });
    this.phase.set('result');
  }

  restart() {
    this.stopTimer();
    this.phase.set('setup');
    this.part5.set([]);
    this.part6.set([]);
    this.part7.set([]);
    this.selected.set({});
    this.isSubmitted.set(false);
    this.score.set(null);
    this.errorMessage.set(null);
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  private startTimer() {
    this.stopTimer();
    this.timerId = setInterval(() => {
      const left = this.remainingSeconds() - 1;
      this.remainingSeconds.set(left);
      if (left <= 0) {
        this.submit(true);
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
