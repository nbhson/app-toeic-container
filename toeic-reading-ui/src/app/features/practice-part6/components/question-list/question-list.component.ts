import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ToeicPart6Question } from '../../../../core/models/toeic.model';

@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [],
  templateUrl: './question-list.component.html',
  styleUrl: './question-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionListComponent {
  questions = input.required<ToeicPart6Question[]>();
  selectedAnswers = input<Record<string, number | null>>({});
  isSubmitted = input<boolean>(false);
  currentPassageId = input<string>('');

  selectOption = output<{questionId: string, optionIdx: number}>();

  getOptionLetter(idx: number): string {
    return String.fromCharCode(65 + idx);
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

  onOptionClick(qId: string, optIdx: number) {
    this.selectOption.emit({questionId: qId, optionIdx: optIdx});
  }
}
