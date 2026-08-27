import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ToeicQuestion } from '../../../../core/models/toeic.model';

@Component({
  selector: 'app-question-card',
  standalone: true,
  templateUrl: './question-card.component.html',
  styleUrl: './question-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionCardComponent {
  // Signal Inputs
  question = input.required<ToeicQuestion>();
  currentIndex = input.required<number>();
  totalQuestions = input.required<number>();
  selectedOption = input<number | null>(null);
  isSubmitted = input<boolean>(false);
  progressPercentage = input<number>(0);

  // Signal Outputs
  optionSelected = output<number>();
  answerSubmitted = output<void>();
  prevPressed = output<void>();
  nextPressed = output<void>();

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
