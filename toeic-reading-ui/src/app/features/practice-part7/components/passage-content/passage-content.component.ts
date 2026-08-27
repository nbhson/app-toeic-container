import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { ToeicPart7Passage } from '../../../../core/models/toeic.model';

@Component({
  selector: 'app-passage-content',
  standalone: true,
  imports: [],
  templateUrl: './passage-content.component.html',
  styleUrl: './passage-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PassageContentComponent {
  passage = input.required<ToeicPart7Passage>();
  currentPassageIndex = input<number>(0);
  totalPages = input<number>(0);
  isSubmitted = input<boolean>(false);

  readonly showTranslation = signal<boolean>(false);

  constructor() {
    // Reset translation when passage changes
    effect(() => {
      this.passage();
      untracked(() => {
        this.showTranslation.set(false);
      });
    });
  }

  toggleTranslation() {
    this.showTranslation.update((val) => !val);
  }

  getPassageBadgeClass(type: string): string {
    switch (type) {
      case 'Single':
        return 'badge-single-passage';
      case 'Double':
        return 'badge-double-passage';
      case 'Triple':
        return 'badge-triple-passage';
      default:
        return 'badge-single-passage';
    }
  }
}
