import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { ToeicPart6Passage } from '../../../../core/models/toeic.model';

@Component({
  selector: 'app-passage-content',
  standalone: true,
  imports: [],
  templateUrl: './passage-content.component.html',
  styleUrl: './passage-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PassageContentComponent {
  passage = input.required<ToeicPart6Passage>();
  currentPassageIndex = input<number>(0);
  totalPages = input<number>(4);
  selectedAnswers = input<Record<string, number | null>>({});
  isSubmitted = input<boolean>(false);

  gapClicked = output<number>();

  showTranslation = signal<boolean>(false);

  toggleTranslation() {
    this.showTranslation.update(val => !val);
  }

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

  hasAnsweredGap(gapNumber: number): boolean {
    const q = this.passage().questions.find(x => x.questionNumber === gapNumber);
    if (!q) return false;
    return this.selectedAnswers()[q.id] !== undefined && this.selectedAnswers()[q.id] !== null;
  }

  isGapCorrect(gapNumber: number): boolean {
    const q = this.passage().questions.find(x => x.questionNumber === gapNumber);
    if (!q) return false;
    const selected = this.selectedAnswers()[q.id];
    return selected === q.correctAnswer;
  }

  onGapClick(gapNumber: number) {
    this.gapClicked.emit(gapNumber);
  }
}
