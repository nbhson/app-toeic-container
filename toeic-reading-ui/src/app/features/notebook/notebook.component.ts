import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToeicService } from '../../core/services/toeic.service';
import { UserStats } from '../../core/models/toeic.model';

interface NotebookItem {
  questionId: string;
  questionText: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timestamp: number;
  /** Explanation/translation from the cached question, when still available. */
  explanation: string | null;
  reviewed: boolean;
  /** 'Part 5' | 'Part 6' | 'Part 7' parsed from the stored question text. */
  partLabel: string;
  /** Question body with the "Part x - " prefix removed. */
  questionBody: string;
}

@Component({
  selector: 'app-notebook',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './notebook.component.html',
  styleUrl: './notebook.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotebookComponent implements OnInit {
  private readonly toeicService = inject(ToeicService);

  readonly stats = this.toeicService.stats;

  /** IDs marked "đã ôn" — kept in a signal so toggles re-render instantly. */
  private readonly reviewedIds = signal<Set<string>>(this.toeicService.getNotebookReviewedIds());

  /** Show reviewed items too? */
  readonly showReviewed = signal<boolean>(false);

  ngOnInit() {
    // Sync reviewed ids from the BE (source of truth when online);
    // localStorage stays the optimistic cache / offline fallback.
    this.toeicService.syncNotebookReviewed().then((merged) => {
      this.reviewedIds.set(merged);
    });
  }

  /** Latest attempt per question; keeps only wrong answers. */
  readonly items = computed<NotebookItem[]>(() => {
    const reviewed = this.reviewedIds();
    const latest = new Map<string, UserStats['history'][number]>();
    for (const h of this.stats().history) {
      const existing = latest.get(h.questionId);
      if (!existing || h.timestamp > existing.timestamp) {
        latest.set(h.questionId, h);
      }
    }
    return [...latest.values()]
      .filter((h) => !h.isCorrect)
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((h) => {
        const q = this.toeicService.getQuestionById(h.questionId) as any;
        // History entries for Part 6/7 are prefixed "Part 6 - Câu 131: ..." /
        // "Part 7 - Câu 147: ..."; Part 5 stores the raw question text.
        const partLabel = h.questionText.startsWith('Part ')
          ? h.questionText.split(' - ')[0]
          : 'Part 5';
        const questionBody = partLabel === 'Part 5'
          ? h.questionText
          : h.questionText.split(' - ').slice(1).join(' - ');
        return {
          questionId: h.questionId,
          questionText: h.questionText,
          partLabel,
          questionBody,
          selectedAnswer: h.selectedAnswer,
          correctAnswer: h.correctAnswer,
          isCorrect: h.isCorrect,
          timestamp: h.timestamp,
          explanation: typeof q?.explanation === 'string' ? q.explanation : null,
          reviewed: reviewed.has(h.questionId),
        } as NotebookItem;
      });
  });

  readonly pendingItems = computed(() => this.items().filter((i) => !i.reviewed));
  readonly reviewedCount = computed(() => this.items().filter((i) => i.reviewed).length);

  /**
   * Query params for the "Luyện Part X" deep-link: carries the stable base
   * question id so the practice page can focus/scroll to the exact question
   * when it is served again (e.g. from the BE question bank).
   */
  practiceQueryParams(item: NotebookItem): Record<string, string> {
    return { questionId: this.toeicService.getBaseQuestionId(item.questionId) };
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) +
      ' ' +
      date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    );
  }

  toggleReviewed(questionId: string) {
    const current = this.reviewedIds();
    const next = new Set(current);
    const nowReviewed = !current.has(questionId);
    if (nowReviewed) {
      next.add(questionId);
    } else {
      next.delete(questionId);
    }
    this.reviewedIds.set(next);
    this.toeicService.setNotebookReviewed(questionId, nowReviewed);
  }

  clearReviewed() {
    for (const id of this.reviewedIds()) {
      this.toeicService.setNotebookReviewed(id, false);
    }
    this.reviewedIds.set(new Set());
  }
}
