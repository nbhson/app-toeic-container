import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToeicService } from '../../core/services/toeic.service';
import { CATEGORIES } from '../../core/constants/app.constants';

/** Display config for the per-category performance card (dedupes the HTML). */
const CATEGORY_META: Array<{ key: string; label: string; badge: string; fill: string }> = [
  { key: CATEGORIES.GRAMMAR, label: 'Ngữ pháp (Grammar)', badge: 'badge-grammar', fill: 'grammar-fill' },
  { key: CATEGORIES.VOCABULARY, label: 'Từ vựng (Vocabulary)', badge: 'badge-vocabulary', fill: 'vocab-fill' },
  { key: CATEGORIES.WORD_FORMS, label: 'Từ loại (Word Forms)', badge: 'badge-wordform', fill: 'wordform-fill' },
  { key: CATEGORIES.SENTENCE_INSERTION, label: 'Điền câu (Sentence Insertion)', badge: 'badge-sentence-insertion', fill: 'sentence-insertion-fill' },
  { key: CATEGORIES.SINGLE_PASSAGE, label: 'Đơn đoạn văn (Single Passage)', badge: 'badge-single-passage', fill: 'single-passage-fill' },
  { key: CATEGORIES.DOUBLE_PASSAGE, label: 'Đoạn văn kép (Double Passage)', badge: 'badge-double-passage', fill: 'double-passage-fill' },
  { key: CATEGORIES.TRIPLE_PASSAGE, label: 'Đoạn văn ba (Triple Passage)', badge: 'badge-triple-passage', fill: 'triple-passage-fill' },
];

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly toeicService = inject(ToeicService);

  // Reactive state from Service Signals
  readonly stats = this.toeicService.stats;

  // Computed signals for reactive UI
  readonly accuracy = computed(() => {
    const s = this.stats();
    return s.totalAnswered > 0 ? Math.round((s.totalCorrect / s.totalAnswered) * 100) : 0;
  });

  /** One computed map replaces the 7 copy-pasted per-category computed signals. */
  readonly categoryRows = computed(() =>
    CATEGORY_META.map((meta) => {
      const s = (this.stats().categoryStats || {})[meta.key] || { answered: 0, correct: 0 };
      const answered = s.answered ?? 0;
      const correct = s.correct ?? 0;
      return {
        ...meta,
        answered,
        correct,
        accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
      };
    }),
  );

  // Recent history (last 5 items)
  readonly recentHistory = computed(() => {
    return [...this.stats().history].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  });

  // Review queue: wrong answers never corrected since (spaced repetition, oldest first)
  readonly reviewQueue = computed(() => this.toeicService.getReviewQueue(20));

  // Weakest attempted category (min 3 answered) to guide study focus
  readonly weakestCategory = computed(() => {
    const stats = this.stats().categoryStats || {};
    const attempted = Object.entries(stats).filter(
      ([, v]: [string, any]) => (v?.answered || 0) >= 3,
    );
    if (attempted.length === 0) return null;
    attempted.sort(
      ([, a]: [string, any], [, b]: [string, any]) =>
        a.correct / a.answered - b.correct / b.answered,
    );
    const [name, v] = attempted[0] as [string, any];
    return { name, accuracy: Math.round((v.correct / v.answered) * 100), answered: v.answered };
  });

  async resetData() {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử luyện tập và kết quả thống kê không?')) {
      await this.toeicService.resetStats();
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // 0 -> A, 1 -> B...
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return (
      date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
      ' ' +
      date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    );
  }
}
