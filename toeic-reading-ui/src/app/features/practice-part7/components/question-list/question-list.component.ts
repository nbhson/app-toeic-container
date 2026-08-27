import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ToeicPart7Question } from '../../../../core/models/toeic.model';

@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [],
  templateUrl: './question-list.component.html',
  styleUrl: './question-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionListComponent {
  questions = input.required<ToeicPart7Question[]>();
  selectedAnswers = input<Record<string, number | null>>({});
  isSubmitted = input<boolean>(false);
  currentPassageId = input<string>('');

  selectOption = output<{ questionId: string; optionIdx: number }>();

  getOptionLetter(idx: number): string {
    return String.fromCharCode(65 + idx);
  }

  onOptionClick(qId: string, optIdx: number) {
    this.selectOption.emit({ questionId: qId, optionIdx: optIdx });
  }
}
