import { Injectable, signal, inject } from '@angular/core';
import {
  ToeicQuestion,
  ToeicPart6Question,
  ToeicPart6Passage,
  ToeicPart7Question,
  ToeicPart7Passage,
  UserStats,
} from '../models/toeic.model';
import { STORAGE_KEYS, CATEGORIES, AIProvider, BE_STATS_URL, getUserId } from '../constants/app.constants';
import { GeminiService } from './gemini.service';
import { OmnirouteService } from './omniroute.service';

@Injectable({
  providedIn: 'root',
})
export class ToeicService {
  private readonly geminiService = inject(GeminiService);
  private readonly omnirouteService = inject(OmnirouteService);

  // Shared reactive state to open/close Settings Modal from any component
  readonly showSettingsModal = signal<boolean>(false);

  // In-memory cache for all questions (Part 5, Part 6, and Part 7 questions)
  private readonly activeQuestionsMap = new Map<
    string,
    ToeicQuestion | ToeicPart6Question | ToeicPart7Question
  >();

  // Global state using Angular Signals
  readonly stats = signal<UserStats>(this.loadStats());

  private statsLoaded = false;

  constructor() {
    // Load stats from BE asynchronously on startup
    this.loadStatsFromBE();
  }

  /**
   * Returns the list of all active cached questions
   */
  getQuestions(): Array<ToeicQuestion | ToeicPart6Question | ToeicPart7Question> {
    return Array.from(this.activeQuestionsMap.values());
  }

  /**
   * Returns a specific question by ID (searches cache)
   */
  getQuestionById(id: string): ToeicQuestion | ToeicPart6Question | ToeicPart7Question | undefined {
    return this.activeQuestionsMap.get(id);
  }

  /**
   * Gets Gemini API key from localStorage
   */
  getGeminiApiKey(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
    }
    return null;
  }

  /**
   * Sets or removes Gemini API key in localStorage
   */
  setGeminiApiKey(key: string) {
    if (typeof window !== 'undefined') {
      if (key && key.trim()) {
        localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
      }
    }
  }

  /**
   * Gets OmniRoute API key from localStorage (legacy, for backward compatibility)
   */
  getOmniRouteApiKey(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.OMNIROUTE_API_KEY);
    }
    return null;
  }

  /**
   * Sets or removes OmniRoute API key in localStorage (legacy, for backward compatibility)
   */
  setOmniRouteApiKey(key: string) {
    if (typeof window !== 'undefined') {
      if (key && key.trim()) {
        localStorage.setItem(STORAGE_KEYS.OMNIROUTE_API_KEY, key.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.OMNIROUTE_API_KEY);
      }
    }
  }

  /**
   * Gets the active AI provider based on which API keys are configured.
   * OmniRoute takes priority if both are set.
   * Checks BE stored key first, then falls back to localStorage for backward compatibility.
   */
  async getActiveProviderAsync(): Promise<AIProvider | null> {
    // Check if BE has a stored OmniRoute key
    const hasStoredKey = await this.omnirouteService.hasStoredOmniRouteKey();
    if (hasStoredKey) return 'omniroute';

    // Fallback to localStorage
    const hasOmniRoute = !!this.getOmniRouteApiKey();
    if (hasOmniRoute) return 'omniroute';

    // Check Gemini key
    const hasGemini = !!this.getGeminiApiKey();
    if (hasGemini) return 'gemini';

    return null;
  }

  /**
   * Gets the active AI provider (synchronous version for backward compatibility).
   * Only checks localStorage - for BE key store, use getActiveProviderAsync().
   */
  getActiveProvider(): AIProvider | null {
    const hasOmniRoute = !!this.getOmniRouteApiKey();
    const hasGemini = !!this.getGeminiApiKey();
    if (hasOmniRoute) return 'omniroute';
    if (hasGemini) return 'gemini';
    return null;
  }

  /**
   * Gets the active API key based on the selected provider (synchronous, from localStorage).
   * For OmniRoute, prefer not passing key to let BE resolve from its stored keys.
   */
  getActiveApiKey(): string | null {
    const provider = this.getActiveProvider();
    if (provider === 'omniroute') return this.getOmniRouteApiKey();
    if (provider === 'gemini') return this.getGeminiApiKey();
    return null;
  }

  /**
   * Gets the active provider's display name
   */
  getActiveProviderName(): string {
    const provider = this.getActiveProvider();
    if (provider === 'omniroute') return 'OmniRoute';
    if (provider === 'gemini') return 'Gemini';
    return 'AI';
  }

  // Legacy methods for backward compatibility
  getApiKey(): string | null {
    return this.getActiveApiKey();
  }

  setApiKey(key: string) {
    // By default, set as OmniRoute key for backward compatibility
    this.setOmniRouteApiKey(key);
  }

  /**
   * Loads Part 5 questions asynchronously from the active AI provider.
   * Throws errors if key is missing or API call fails.
   */
  async loadPracticeQuestions(count: number): Promise<ToeicQuestion[]> {
    const provider = this.getActiveProvider();
    const apiKey = this.getActiveApiKey();
    if (!apiKey || !provider) {
      throw new Error(
        'Vui lòng cấu hình Gemini hoặc OmniRoute API Key trong phần cài đặt để tải câu hỏi luyện tập.',
      );
    }

    try {
      const aiQuestions = provider === 'omniroute'
        ? await this.omnirouteService.generateToeicQuestions(count, apiKey)
        : await this.geminiService.generateToeicQuestions(count, apiKey);
      if (aiQuestions && aiQuestions.length > 0) {
        const sessionId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
        const uniqueQuestions = aiQuestions.map((q, idx) => ({
          ...q,
          id: `${q.id}-${sessionId}-${idx}`,
        }));
        // Log duplicate options for debugging
        this.logDuplicateOptions('Part 5', uniqueQuestions);
        // Cache dynamic questions so they can be looked up when saving answers
        uniqueQuestions.forEach((q) => this.activeQuestionsMap.set(q.id, q));
        return uniqueQuestions;
      }
      throw new Error(`Không nhận được danh sách câu hỏi hợp lệ từ ${this.getActiveProviderName()} API.`);
    } catch (error) {
      console.error(`Error generating questions from ${this.getActiveProviderName()} API:`, error);
      throw new Error(
        `Không thể kết nối hoặc gọi ${this.getActiveProviderName()} API. Vui lòng kiểm tra lại API Key hoặc kết nối mạng.`,
      );
    }
  }

  /**
   * Loads Part 6 passages asynchronously from the active AI provider.
   * Throws errors if key is missing or API call fails.
   */
  async loadPart6Passages(count: number): Promise<ToeicPart6Passage[]> {
    const provider = this.getActiveProvider();
    const apiKey = this.getActiveApiKey();
    if (!apiKey || !provider) {
      throw new Error(
        'Vui lòng cấu hình Gemini hoặc OmniRoute API Key trong phần cài đặt để tải câu hỏi luyện tập Part 6.',
      );
    }

    try {
      const passages = provider === 'omniroute'
        ? await this.omnirouteService.generateToeicPart6Passages(count, apiKey)
        : await this.geminiService.generateToeicPart6Passages(count, apiKey);
      if (passages && passages.length > 0) {
        const sessionId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
        const uniquePassages = passages.map((p, pIdx) => {
          const uniqueQuestions = p.questions.map((q, qIdx) => ({
            ...q,
            id: `${q.id}-${sessionId}-${pIdx}-${qIdx}`,
          }));
          return {
            ...p,
            id: `${p.id}-${sessionId}-${pIdx}`,
            questions: uniqueQuestions,
          };
        });
        // Log duplicate options for debugging
        for (const p of uniquePassages) {
          this.logDuplicateOptions('Part 6', p.questions);
        }
        // Cache questions belonging to each passage
        uniquePassages.forEach((p) => {
          p.questions.forEach((q) => this.activeQuestionsMap.set(q.id, q));
        });
        return uniquePassages;
      }
      throw new Error(`Không nhận được danh sách đoạn văn hợp lệ từ ${this.getActiveProviderName()} API.`);
    } catch (error) {
      console.error(`Error generating Part 6 passages from ${this.getActiveProviderName()} API:`, error);
      throw new Error(
        `Không thể kết nối hoặc gọi ${this.getActiveProviderName()} API. Vui lòng kiểm tra lại API Key hoặc kết nối mạng.`,
      );
    }
  }

  /**
   * Loads Part 7 passages asynchronously from the active AI provider.
   * Runs batches in parallel for full mock test to prevent API timeouts.
   */
  async loadPart7Passages(isFullMock: boolean): Promise<ToeicPart7Passage[]> {
    const provider = this.getActiveProvider();
    const apiKey = this.getActiveApiKey();
    if (!apiKey || !provider) {
      throw new Error(
        'Vui lòng cấu hình Gemini hoặc OmniRoute API Key trong phần cài đặt để tải câu hỏi luyện tập Part 7.',
      );
    }

    try {
      let passages: ToeicPart7Passage[] = [];
      if (provider === 'omniroute') {
        // Use batch endpoint to eliminate multiple HTTP round-trips
        const batches = isFullMock
          ? [
              { passageType: 'Single' as const, count: 5, startQuestionNumber: 147 },
              { passageType: 'Single' as const, count: 5, startQuestionNumber: 158 },
              { passageType: 'Double' as const, count: 2, startQuestionNumber: 176 },
              { passageType: 'Triple' as const, count: 3, startQuestionNumber: 186 },
            ]
          : [
              { passageType: 'Single' as const, count: 1, startQuestionNumber: 147 },
              { passageType: 'Double' as const, count: 1, startQuestionNumber: 150 },
            ];
        passages = await this.omnirouteService.generateToeicPart7Batch(batches, apiKey);
      } else {
        // Gemini: sequential calls (no batch endpoint)
        const generatePart7 = this.geminiService.generateToeicPart7Passages.bind(this.geminiService);
        if (isFullMock) {
          const batch1 = await generatePart7('Single', 5, 147, apiKey);
          const batch2 = await generatePart7('Single', 5, 158, apiKey);
          const batch3 = await generatePart7('Double', 2, 176, apiKey);
          const batch4 = await generatePart7('Triple', 3, 186, apiKey);
          passages = [...batch1, ...batch2, ...batch3, ...batch4];
        } else {
          const singlePassages = await generatePart7('Single', 1, 147, apiKey);
          const doublePassages = await generatePart7('Double', 1, 150, apiKey);
          passages = [...singlePassages, ...doublePassages];
        }
      }

      if (passages && passages.length > 0) {
        const sessionId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
        let currentQuestionNumber = 147;

        const uniquePassages = passages.map((p, pIdx) => {
          const uniqueQuestions = p.questions.map((q, qIdx) => {
            const questionNumber = currentQuestionNumber++;
            return {
              ...q,
              id: `${q.id}-${sessionId}-${pIdx}-${qIdx}`,
              questionNumber,
            };
          });

          return {
            ...p,
            id: `${p.id}-${sessionId}-${pIdx}`,
            questions: uniqueQuestions,
          };
        });

        // Log duplicate options for debugging
        const allPart7Questions = uniquePassages.flatMap(p => p.questions);
        this.logDuplicateOptions('Part 7', allPart7Questions);
        // Cache questions and inject categories dynamically for stats
        uniquePassages.forEach((p) => {
          const category =
            p.passageType === 'Single'
              ? CATEGORIES.SINGLE_PASSAGE
              : p.passageType === 'Double'
                ? CATEGORIES.DOUBLE_PASSAGE
                : CATEGORIES.TRIPLE_PASSAGE;

          p.questions.forEach((q) => {
            const cachedQuestion = {
              ...q,
              category,
            };
            this.activeQuestionsMap.set(q.id, cachedQuestion as any);
          });
        });

        return uniquePassages;
      }
      throw new Error(`Không nhận được danh sách đoạn văn Part 7 hợp lệ từ ${this.getActiveProviderName()} API.`);
    } catch (error) {
      console.error(`Error generating Part 7 passages from ${this.getActiveProviderName()} API:`, error);
      throw new Error(
        `Không thể kết nối hoặc gọi ${this.getActiveProviderName()} API. Vui lòng kiểm tra lại API Key hoặc kết nối mạng.`,
      );
    }
  }

  /**
   * Loads stats from BE API, falls back to localStorage.
   */
  private async loadStatsFromBE() {
    try {
      const userId = getUserId();
      const response = await fetch(`${BE_STATS_URL}/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.stats) {
          // Migration check
          const stats = data.stats as UserStats;
          if (stats && stats.categoryStats) {
            if (!stats.categoryStats[CATEGORIES.SENTENCE_INSERTION]) {
              stats.categoryStats[CATEGORIES.SENTENCE_INSERTION] = { answered: 0, correct: 0 };
            }
            if (!stats.categoryStats[CATEGORIES.SINGLE_PASSAGE]) {
              stats.categoryStats[CATEGORIES.SINGLE_PASSAGE] = { answered: 0, correct: 0 };
            }
            if (!stats.categoryStats[CATEGORIES.DOUBLE_PASSAGE]) {
              stats.categoryStats[CATEGORIES.DOUBLE_PASSAGE] = { answered: 0, correct: 0 };
            }
            if (!stats.categoryStats[CATEGORIES.TRIPLE_PASSAGE]) {
              stats.categoryStats[CATEGORIES.TRIPLE_PASSAGE] = { answered: 0, correct: 0 };
            }
          }
          this.stats.set(stats);
          this.statsLoaded = true;
          // Also update localStorage as backup
          this.saveStatsToLocalStorage(stats);
          return;
        }
      }
    } catch (error) {
      console.warn('Could not load stats from BE, falling back to localStorage:', error);
    }
    // Fallback: load from localStorage (already done in signal initialization)
    this.statsLoaded = true;
  }

  /**
   * Submits an answer, updates statistical states reactively, and persists to BE.
   * Works generically for both Part 5 (ToeicQuestion) and Part 6 (ToeicPart6Question) questions.
   */
  saveAnswer(questionId: string, selectedAnswer: number) {
    const question = this.getQuestionById(questionId);
    if (!question) return;

    const isCorrect = question.correctAnswer === selectedAnswer;
    const currentStats = this.stats();

    const existingIndex = currentStats.history.findIndex((h) => h.questionId === questionId);

    let updatedHistory = [...currentStats.history];
    let totalCorrectAdjustment = 0;
    let totalIncorrectAdjustment = 0;

    const categoryName = (question as any).category;
    const categoryStats = { ...currentStats.categoryStats };

    // Ensure the category structure is initialized dynamically
    if (!categoryStats[categoryName]) {
      categoryStats[categoryName] = { answered: 0, correct: 0 };
    }

    let questionText = '';
    if ('question' in question) {
      const isPart7 =
        (question as any).category === CATEGORIES.SINGLE_PASSAGE ||
        (question as any).category === CATEGORIES.DOUBLE_PASSAGE ||
        (question as any).category === CATEGORIES.TRIPLE_PASSAGE;
      questionText = isPart7
        ? `Part 7 - Câu ${(question as any).questionNumber}: ${question.question}`
        : question.question;
    } else {
      questionText = `Part 6 - Câu ${question.questionNumber}`;
    }

    if (existingIndex > -1) {
      const previousResult = updatedHistory[existingIndex];

      // Remove old impact from totals
      if (previousResult.isCorrect) {
        totalCorrectAdjustment = -1;
        categoryStats[categoryName].correct = Math.max(0, categoryStats[categoryName].correct - 1);
      } else {
        totalIncorrectAdjustment = -1;
      }

      // Update history entry
      updatedHistory[existingIndex] = {
        questionId,
        questionText,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        timestamp: Date.now(),
      };
    } else {
      // First time answering: increment category totals
      categoryStats[categoryName].answered += 1;

      updatedHistory.push({
        questionId,
        questionText,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        timestamp: Date.now(),
      });
    }

    // Add new impact
    if (isCorrect) {
      totalCorrectAdjustment += 1;
      categoryStats[categoryName].correct += 1;
    } else {
      totalIncorrectAdjustment += 1;
    }

    const updatedStats: UserStats = {
      totalAnswered: currentStats.totalAnswered + (existingIndex > -1 ? 0 : 1),
      totalCorrect: currentStats.totalCorrect + totalCorrectAdjustment,
      totalIncorrect: currentStats.totalIncorrect + totalIncorrectAdjustment,
      categoryStats,
      history: updatedHistory,
    };

    // Update signal state
    this.stats.set(updatedStats);
    this.persistStats(updatedStats);
  }

  /**
   * Resets all user stats and clears storage
   */
  async resetStats() {
    const defaultStats = this.getDefaultStats();
    this.stats.set(defaultStats);

    // Clear from BE
    try {
      const userId = getUserId();
      await fetch(`${BE_STATS_URL}/${userId}`, { method: 'DELETE' });
    } catch (error) {
      console.warn('Could not delete stats from BE:', error);
    }
    // Clear localStorage backup
    this.saveStatsToLocalStorage(defaultStats);
  }

  private getDefaultStats(): UserStats {
    return {
      totalAnswered: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      categoryStats: {
        [CATEGORIES.GRAMMAR]: { answered: 0, correct: 0 },
        [CATEGORIES.VOCABULARY]: { answered: 0, correct: 0 },
        [CATEGORIES.WORD_FORMS]: { answered: 0, correct: 0 },
        [CATEGORIES.SENTENCE_INSERTION]: { answered: 0, correct: 0 },
        [CATEGORIES.SINGLE_PASSAGE]: { answered: 0, correct: 0 },
        [CATEGORIES.DOUBLE_PASSAGE]: { answered: 0, correct: 0 },
        [CATEGORIES.TRIPLE_PASSAGE]: { answered: 0, correct: 0 },
      },
      history: [],
    };
  }

  private loadStats(): UserStats {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.STATS);
        if (data) {
          const stats = JSON.parse(data) as UserStats;
          // Migration check for older stats databases to include new categories
          if (stats && stats.categoryStats) {
            if (!stats.categoryStats[CATEGORIES.SENTENCE_INSERTION]) {
              stats.categoryStats[CATEGORIES.SENTENCE_INSERTION] = { answered: 0, correct: 0 };
            }
            if (!stats.categoryStats[CATEGORIES.SINGLE_PASSAGE]) {
              stats.categoryStats[CATEGORIES.SINGLE_PASSAGE] = { answered: 0, correct: 0 };
            }
            if (!stats.categoryStats[CATEGORIES.DOUBLE_PASSAGE]) {
              stats.categoryStats[CATEGORIES.DOUBLE_PASSAGE] = { answered: 0, correct: 0 };
            }
            if (!stats.categoryStats[CATEGORIES.TRIPLE_PASSAGE]) {
              stats.categoryStats[CATEGORIES.TRIPLE_PASSAGE] = { answered: 0, correct: 0 };
            }
          }
          return stats;
        }
      } catch (e) {
        console.error('Error loading stats from local storage', e);
      }
    }
    return this.getDefaultStats();
  }

  /**
   * Persists stats to both BE and localStorage (backup).
   */
  private async persistStats(stats: UserStats) {
    // Save to localStorage as backup
    this.saveStatsToLocalStorage(stats);

    // Save to BE
    try {
      const userId = getUserId();
      await fetch(`${BE_STATS_URL}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats }),
      });
    } catch (error) {
      console.warn('Could not save stats to BE:', error);
    }
  }

  // ── Duplicate Option Detection ──────────────────────────────

  /**
   * Detects questions with duplicate options and logs warnings.
   * Returns count of problematic questions found.
   */
  private logDuplicateOptions(label: string, questions: Array<{ id: string; options: string[]; correctAnswer: number }>): number {
    let dupes = 0;
    for (const q of questions) {
      const unique = new Set(q.options.map(o => o.trim().toLowerCase()));
      if (unique.size < q.options.length) {
        dupes++;
        if (dupes <= 5) {
          console.warn(`[DuplicateOptions] ${label} ${q.id}: options not unique`, q.options);
        }
      }
    }
    if (dupes > 0) {
      console.warn(`[DuplicateOptions] ${label}: ${dupes}/${questions.length} questions have duplicate options`);
    } else {
      console.log(`[DuplicateOptions] ${label}: all ${questions.length} questions have unique options ✓`);
    }
    return dupes;
  }

  /**
   * Saves stats to localStorage as a backup.
   */
  private saveStatsToLocalStorage(stats: UserStats) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
      } catch (e) {
        console.error('Error saving stats to local storage', e);
      }
    }
  }
}
