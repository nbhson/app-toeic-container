import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ToeicQuestion, UserStats } from '../../../../core/models/toeic.model';

@Component({
  selector: 'app-question-map',
  standalone: true,
  templateUrl: './question-map.component.html',
  styleUrl: './question-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionMapComponent {
  // Signal Inputs
  questions = input.required<ToeicQuestion[]>();
  currentIndex = input.required<number>();
  stats = input.required<UserStats>();

  // Signal Outputs
  questionSelected = output<number>();

  isQuestionCorrect(questionId: string): boolean {
    const h = this.stats().history.find(x => x.questionId === questionId);
    return h ? h.isCorrect : false;
  }

  isQuestionIncorrect(questionId: string): boolean {
    const h = this.stats().history.find(x => x.questionId === questionId);
    return h ? !h.isCorrect : false;
  }
}
