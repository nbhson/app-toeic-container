import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
  resource,
  effect,
  untracked,
  HostListener,
} from '@angular/core';
import { ToeicService } from '../../core/services/toeic.service';
import { ToeicPart7Passage } from '../../core/models/toeic.model';
import { HasPendingChanges } from '../../core/guards/pending-changes.guard';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { PassageContentComponent } from './components/passage-content/passage-content.component';
import { QuestionListComponent } from './components/question-list/question-list.component';

@Component({
  selector: 'app-practice-part7',
  standalone: true,
  imports: [ConfirmModalComponent, PassageContentComponent, QuestionListComponent],
  templateUrl: './practice-part7.component.html',
  styleUrl: './practice-part7.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticePart7Component implements HasPendingChanges {
  private readonly toeicService = inject(ToeicService);

  // Leave confirmation modal states
  showConfirmLeaveModal = signal<boolean>(false);
  private resolveLeave: ((value: boolean) => void) | null = null;

  // Selected mode: null (selection screen), 'mini' (Mini-Test), 'full' (Full Mock Test)
  readonly practiceMode = signal<'mini' | 'full' | null>(null);

  // Explicit error signal for reliable error display
  readonly errorMessage = signal<string | null>(null);

  // Resource for async data loading based on selected mode (using Angular 22+ params property)
  readonly passagesResource = resource({
    params: () => this.practiceMode(),
    loader: async ({ params: mode }) => {
      this.errorMessage.set(null);
      if (!mode) return [];
      try {
        const isFull = mode === 'full';
        return await this.toeicService.loadPart7Passages(isFull);
      } catch (error: any) {
        this.errorMessage.set(error?.message || 'Đã xảy ra lỗi không xác định.');
        return [];
      }
    },
  });

  // Derived state values
  readonly passages = computed(() => this.passagesResource.value() || []);
  readonly isLoading = this.passagesResource.isLoading;

  // Active navigation
  readonly currentPassageIndex = signal<number>(0);
  readonly currentPassage = computed(() => this.passages()[this.currentPassageIndex()]);

  // Selected answers dictionary (keyed by questionId)
  readonly selectedAnswers = signal<Record<string, number | null>>({});

  // Submission state dictionary (keyed by passageId)
  readonly isSubmitted = signal<Record<string, boolean>>({});

  openSettings() {
    this.toeicService.showSettingsModal.set(true);
  }

  selectMode(mode: 'mini' | 'full') {
    this.practiceMode.set(mode);
    this.currentPassageIndex.set(0);
    this.selectedAnswers.set({});
    this.isSubmitted.set({});
  }

  resetSession() {
    this.practiceMode.set(null);
    this.currentPassageIndex.set(0);
    this.selectedAnswers.set({});
    this.isSubmitted.set({});
  }

  // Navigation handlers
  prevPassage() {
    if (this.currentPassageIndex() > 0) {
      this.currentPassageIndex.update((idx) => idx - 1);
    }
  }

  nextPassage() {
    if (this.currentPassageIndex() < this.passages().length - 1) {
      this.currentPassageIndex.update((idx) => idx + 1);
    }
  }

  goToPassage(index: number) {
    if (index >= 0 && index < this.passages().length) {
      this.currentPassageIndex.set(index);
    }
  }

  // Option selection handler
  selectOption(questionId: string, optionIndex: number) {
    const passage = this.currentPassage();
    if (!passage || this.isSubmitted()[passage.id]) return;

    this.selectedAnswers.update((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  }

  // Submission handler for the active passage
  submitPassage(passageId: string) {
    const passage = this.passages().find((p) => p.id === passageId);
    if (!passage || this.isSubmitted()[passageId]) return;

    // Verify all questions are answered for this passage
    let allAnswered = true;
    for (const q of passage.questions) {
      const selection = this.selectedAnswers()[q.id];
      if (selection === undefined || selection === null) {
        allAnswered = false;
        break;
      }
    }

    if (!allAnswered) {
      alert('Vui lòng trả lời đầy đủ tất cả câu hỏi của đoạn văn này trước khi nộp bài.');
      return;
    }

    // Submit answers to service
    for (const q of passage.questions) {
      const selection = this.selectedAnswers()[q.id];
      if (selection !== undefined && selection !== null) {
        this.toeicService.saveAnswer(q.id, selection);
      }
    }

    // Mark as submitted
    this.isSubmitted.update((prev) => ({
      ...prev,
      [passageId]: true,
    }));
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.hasUnsavedProgress()) {
      $event.returnValue = true;
    }
  }

  hasUnsavedProgress(): boolean {
    const list = this.passages();
    if (list.length === 0) {
      console.log('[Part 7] hasUnsavedProgress: list length is 0');
      return false;
    }

    // Check for selected answers that are not yet submitted
    const hasUnsubmittedSelections = list.some((passage) => {
      const isPassageSubmitted = this.isSubmitted()[passage.id];
      if (isPassageSubmitted) return false;
      return passage.questions.some((q) => {
        const sel = this.selectedAnswers()[q.id];
        const hasSel = sel !== undefined && sel !== null;
        if (hasSel) {
          console.log(
            `[Part 7] Found unsubmitted selection for Q${q.questionNumber} (${q.id}): ${sel}`,
          );
        }
        return hasSel;
      });
    });

    const submittedCount = list.filter((p) => this.isSubmitted()[p.id]).length;
    const hasActiveSession = submittedCount > 0 && submittedCount < list.length;

    console.log('[Part 7] hasUnsavedProgress evaluation:', {
      hasUnsubmittedSelections,
      hasActiveSession,
      submittedCount,
      totalPassages: list.length,
      selectedAnswers: this.selectedAnswers(),
    });

    return hasUnsubmittedSelections || hasActiveSession;
  }

  confirmLeave(): Promise<boolean> | boolean {
    console.log('[Part 7] confirmLeave guard checking...');
    const hasProgress = this.hasUnsavedProgress();
    console.log('[Part 7] confirmLeave: hasUnsavedProgress =', hasProgress);
    if (!hasProgress) {
      return true;
    }
    console.log('[Part 7] confirmLeave: intercepting navigation, showing modal');
    this.showConfirmLeaveModal.set(true);
    return new Promise<boolean>((resolve) => {
      this.resolveLeave = resolve;
    });
  }

  onConfirmLeaveResponse(accept: boolean) {
    console.log('[Part 7] onConfirmLeaveResponse:', accept);
    this.showConfirmLeaveModal.set(false);
    if (this.resolveLeave) {
      this.resolveLeave(accept);
      this.resolveLeave = null;
    }
  }
}
