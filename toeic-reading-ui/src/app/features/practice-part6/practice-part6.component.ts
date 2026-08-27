import { Component, ChangeDetectionStrategy, computed, inject, signal, resource, effect, untracked, HostListener } from '@angular/core';
import { ToeicService } from '../../core/services/toeic.service';
import { ToeicPart6Passage } from '../../core/models/toeic.model';
import { HasPendingChanges } from '../../core/guards/pending-changes.guard';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { PassageContentComponent } from './components/passage-content/passage-content.component';
import { QuestionListComponent } from './components/question-list/question-list.component';

@Component({
  selector: 'app-practice-part6',
  standalone: true,
  imports: [ConfirmModalComponent, PassageContentComponent, QuestionListComponent],
  templateUrl: './practice-part6.component.html',
  styleUrl: './practice-part6.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PracticePart6Component implements HasPendingChanges {
  private readonly toeicService = inject(ToeicService);

  showConfirmLeaveModal = signal<boolean>(false);
  private resolveLeave: ((value: boolean) => void) | null = null;

  // Global settings access
  openSettings() {
    this.toeicService.showSettingsModal.set(true);
  }

  // Explicit error signal for reliable error display
  readonly errorMessage = signal<string | null>(null);

  // Load Part 6 Passages (4 passages, containing 16 questions total to match real TOEIC exam)
  readonly passagesResource = resource({
    loader: async () => {
      this.errorMessage.set(null);
      try {
        return await this.toeicService.loadPart6Passages(4);
      } catch (error: any) {
        this.errorMessage.set(error?.message || 'Đã xảy ra lỗi không xác định.');
        return [];
      }
    }
  });

  // Reactive state derived from the resource
  readonly passages = computed(() => this.passagesResource.value() || []);
  readonly isLoading = this.passagesResource.isLoading;

  // Active Passage navigation
  readonly currentPassageIndex = signal<number>(0);
  readonly currentPassage = computed(() => this.passages()[this.currentPassageIndex()]);

  // Selected answers dictionary (keyed by questionId)
  readonly selectedAnswers = signal<Record<string, number | null>>({});

  // Submission state dictionary (keyed by passageId)
  readonly isSubmitted = signal<Record<string, boolean>>({});

  // Translation view state for the active passage
  readonly showTranslation = signal<boolean>(false);

  constructor() {
    // Reset translation state when moving between passages
    effect(() => {
      this.currentPassageIndex();
      untracked(() => {
        this.showTranslation.set(false);
      });
    });
  }

  // Navigation handlers
  prevPassage() {
    if (this.currentPassageIndex() > 0) {
      this.currentPassageIndex.update(idx => idx - 1);
    }
  }

  nextPassage() {
    if (this.currentPassageIndex() < this.passages().length - 1) {
      this.currentPassageIndex.update(idx => idx + 1);
    }
  }

  goToPassage(index: number) {
    if (index >= 0 && index < this.passages().length) {
      this.currentPassageIndex.set(index);
    }
  }

  // Answer selection handler
  selectOption(questionId: string, optionIndex: number) {
    const passage = this.currentPassage();
    if (!passage || this.isSubmitted()[passage.id]) return;

    this.selectedAnswers.update(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  }

  // Submission handler for the whole passage
  submitPassage(passageId: string) {
    const passage = this.passages().find(p => p.id === passageId);
    if (!passage || this.isSubmitted()[passageId]) return;

    // Verify all 4 questions are answered
    let allAnswered = true;
    for (const q of passage.questions) {
      const selection = this.selectedAnswers()[q.id];
      if (selection === undefined || selection === null) {
        allAnswered = false;
        break;
      }
    }

    if (!allAnswered) {
      alert('Vui lòng chọn đầy đủ đáp án cho tất cả 4 câu hỏi trống trước khi nộp bài.');
      return;
    }

    // Submit answers to service stats
    for (const q of passage.questions) {
      const selection = this.selectedAnswers()[q.id];
      if (selection !== undefined && selection !== null) {
        this.toeicService.saveAnswer(q.id, selection);
      }
    }

    // Mark as submitted
    this.isSubmitted.update(prev => ({
      ...prev,
      [passageId]: true
    }));
  }

  // Segment parser for rendering gap badge triggers inline
  getPassageSegments(text: string): string[] {
    if (!text) return [];
    return text.split(/(\[\d+\])/g);
  }

  isGapMarker(segment: string): boolean {
    return /^\[\d+\]$/.test(segment);
  }

  getGapNumber(segment: string): number {
    return parseInt(segment.replace(/[\[\]]/g, ''), 10);
  }

  // Highlighting states for the text segments
  hasAnsweredGap(gapNumber: number): boolean {
    const q = this.currentPassage()?.questions.find(x => x.questionNumber === gapNumber);
    if (!q) return false;
    return this.selectedAnswers()[q.id] !== undefined && this.selectedAnswers()[q.id] !== null;
  }

  isGapCorrect(gapNumber: number): boolean {
    const q = this.currentPassage()?.questions.find(x => x.questionNumber === gapNumber);
    if (!q) return false;
    const selected = this.selectedAnswers()[q.id];
    return selected === q.correctAnswer;
  }

  // Interactive scroll focus to corresponding question card
  scrollToQuestion(gapNumber: number) {
    const cardElement = document.getElementById(`q-card-${gapNumber}`);
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cardElement.classList.add('highlight-flash');
      setTimeout(() => {
        cardElement.classList.remove('highlight-flash');
      }, 1500);
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  toggleTranslation() {
    this.showTranslation.update(val => !val);
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'Grammar': return 'badge-grammar';
      case 'Vocabulary': return 'badge-vocabulary';
      case 'Word Forms': return 'badge-wordform';
      case 'Sentence Insertion': return 'badge-sentence-insertion';
      default: return 'badge-grammar';
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.hasUnsavedProgress()) {
      $event.returnValue = true;
    }
  }

  hasUnsavedProgress(): boolean {
    const list = this.passages();
    if (list.length === 0) return false;

    // Check if there are selected answers in the dictionary that have not been submitted yet
    const hasUnsubmittedSelections = list.some(passage => {
      const isPassageSubmitted = this.isSubmitted()[passage.id];
      if (isPassageSubmitted) return false;
      return passage.questions.some(q => {
        const sel = this.selectedAnswers()[q.id];
        return sel !== undefined && sel !== null;
      });
    });

    // Also check if they have started the session (submitted at least one passage, but not all)
    const submittedCount = list.filter(p => this.isSubmitted()[p.id]).length;
    const hasActiveSession = submittedCount > 0 && submittedCount < list.length;

    return hasUnsubmittedSelections || hasActiveSession;
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
