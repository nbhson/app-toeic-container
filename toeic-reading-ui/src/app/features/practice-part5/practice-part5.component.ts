import { Component, ChangeDetectionStrategy, computed, inject, signal, resource, effect, untracked, HostListener } from '@angular/core';
import { ToeicService } from '../../core/services/toeic.service';
import { ToeicQuestion } from '../../core/models/toeic.model';
import { QuestionCardComponent } from './components/question-card/question-card.component';
import { QuestionMapComponent } from './components/question-map/question-map.component';
import { HasPendingChanges } from '../../core/guards/pending-changes.guard';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-practice-part5',
  imports: [QuestionCardComponent, QuestionMapComponent, ConfirmModalComponent],
  templateUrl: './practice-part5.component.html',
  styleUrl: './practice-part5.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PracticePart5Component implements HasPendingChanges {
  private readonly toeicService = inject(ToeicService);

  showConfirmLeaveModal = signal<boolean>(false);
  private resolveLeave: ((value: boolean) => void) | null = null;

  currentIndex = signal<number>(0);
  selectedOption = signal<number | null>(null);
  isSubmitted = signal<boolean>(false);

  // Explicit error signal for reliable error display
  readonly errorMessage = signal<string | null>(null);

  // Read service stats history to check if the question was answered
  readonly stats = this.toeicService.stats;

  // Modern Angular 19+ Resource API for loading questions asynchronously
  readonly questionsResource = resource({
    loader: async () => {
      this.errorMessage.set(null);
      try {
        return await this.toeicService.loadPracticeQuestions(30);
      } catch (error: any) {
        this.errorMessage.set(error?.message || 'Đã xảy ra lỗi không xác định.');
        return [];
      }
    }
  });

  // Reactive Computed Signals (Tải và tính toán dữ liệu tối ưu hiệu năng)
  readonly questions = computed(() => this.questionsResource.value() || []);
  readonly isLoading = computed(() => this.questionsResource.isLoading());
  readonly currentQuestion = computed(() => this.questions()[this.currentIndex()]);
  readonly progressPercentage = computed(() => {
    const listLength = this.questions().length;
    if (listLength === 0) return 0;
    return Math.round(((this.currentIndex() + 1) / listLength) * 100);
  });

  constructor() {
    // Automatically reset selection states when new questions load
    effect(() => {
      const q = this.questionsResource.value();
      if (q && q.length > 0) {
        untracked(() => {
          this.currentIndex.set(0);
          this.checkIfAlreadyAnswered();
        });
      }
    });
  }

  selectOption(index: number) {
    if (this.isSubmitted()) return;
    this.selectedOption.set(index);
  }

  submitAnswer() {
    const selected = this.selectedOption();
    if (selected === null || this.isSubmitted()) return;

    this.isSubmitted.set(true);
    this.toeicService.saveAnswer(this.currentQuestion().id, selected);
  }

  nextQuestion() {
    if (this.currentIndex() < this.questions().length - 1) {
      this.currentIndex.update(i => i + 1);
      this.checkIfAlreadyAnswered();
    }
  }

  prevQuestion() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
      this.checkIfAlreadyAnswered();
    }
  }

  goToQuestion(index: number) {
    if (index >= 0 && index < this.questions().length) {
      this.currentIndex.set(index);
      this.checkIfAlreadyAnswered();
    }
  }

  openSettings() {
    this.toeicService.showSettingsModal.set(true);
  }

  private checkIfAlreadyAnswered() {
    const questionId = this.currentQuestion()?.id;
    if (!questionId) return;

    const historyEntry = this.stats().history.find(h => h.questionId === questionId);
    if (historyEntry) {
      this.selectedOption.set(historyEntry.selectedAnswer);
      this.isSubmitted.set(true);
    } else {
      this.selectedOption.set(null);
      this.isSubmitted.set(false);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.hasUnsavedProgress()) {
      $event.returnValue = true;
    }
  }

  hasUnsavedProgress(): boolean {
    const list = this.questions();
    if (list.length === 0) return false;

    // Check if the current question has a selection that hasn't been submitted
    const hasUnsubmittedSelection = this.selectedOption() !== null && !this.isSubmitted();
    if (hasUnsubmittedSelection) return true;

    // Count how many questions of the current list have been answered in history
    const answeredCount = list.filter(q => this.stats().history.some(h => h.questionId === q.id)).length;
    return answeredCount > 0 && answeredCount < list.length;
  }

  confirmLeave(): Promise<boolean> | boolean {
    if (!this.hasUnsavedProgress()) {
      return true;
    }
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
