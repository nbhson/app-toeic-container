import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToeicService } from '../../core/services/toeic.service';

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

  readonly grammarAccuracy = computed(() => {
    const s = this.stats().categoryStats['Grammar'];
    return s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
  });

  readonly vocabAccuracy = computed(() => {
    const s = this.stats().categoryStats['Vocabulary'];
    return s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
  });

  readonly wordFormAccuracy = computed(() => {
    const s = this.stats().categoryStats['Word Forms'];
    return s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
  });

  readonly sentenceInsertionAccuracy = computed(() => {
    const s = this.stats().categoryStats['Sentence Insertion'];
    if (!s) return 0;
    return s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
  });

  readonly singlePassageAccuracy = computed(() => {
    const s = this.stats().categoryStats['Single Passage'];
    if (!s) return 0;
    return s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
  });

  readonly doublePassageAccuracy = computed(() => {
    const s = this.stats().categoryStats['Double Passage'];
    if (!s) return 0;
    return s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
  });

  readonly triplePassageAccuracy = computed(() => {
    const s = this.stats().categoryStats['Triple Passage'];
    if (!s) return 0;
    return s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
  });

  // Recent history (last 5 items)
  readonly recentHistory = computed(() => {
    return [...this.stats().history].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
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
