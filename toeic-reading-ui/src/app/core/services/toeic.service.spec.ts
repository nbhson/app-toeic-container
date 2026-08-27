import { TestBed } from '@angular/core/testing';
import { ToeicService } from './toeic.service';
import { OmnirouteService } from './omniroute.service';
import { UserStats, ToeicQuestion } from '../models/toeic.model';
import { CATEGORIES, STORAGE_KEYS } from '../constants/app.constants';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ToeicService', () => {
  let service: ToeicService;
  let omnirouteServiceMock: Partial<OmnirouteService>;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    omnirouteServiceMock = {
      generateToeicQuestions: vi.fn(),
      generateToeicPart6Passages: vi.fn(),
      generateToeicPart7Passages: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ToeicService,
        { provide: OmnirouteService, useValue: omnirouteServiceMock },
      ],
    });
    service = TestBed.inject(ToeicService);
  });

  describe('initial state', () => {
    it('should have default stats on initialization', () => {
      const stats = service.stats();
      expect(stats.totalAnswered).toBe(0);
      expect(stats.totalCorrect).toBe(0);
      expect(stats.totalIncorrect).toBe(0);
      expect(stats.history).toEqual([]);
      expect(stats.categoryStats).toBeDefined();
      expect(stats.categoryStats[CATEGORIES.GRAMMAR]).toEqual({ answered: 0, correct: 0 });
      expect(stats.categoryStats[CATEGORIES.VOCABULARY]).toEqual({ answered: 0, correct: 0 });
      expect(stats.categoryStats[CATEGORIES.WORD_FORMS]).toEqual({ answered: 0, correct: 0 });
      expect(stats.categoryStats[CATEGORIES.SENTENCE_INSERTION]).toEqual({ answered: 0, correct: 0 });
      expect(stats.categoryStats[CATEGORIES.SINGLE_PASSAGE]).toEqual({ answered: 0, correct: 0 });
      expect(stats.categoryStats[CATEGORIES.DOUBLE_PASSAGE]).toEqual({ answered: 0, correct: 0 });
      expect(stats.categoryStats[CATEGORIES.TRIPLE_PASSAGE]).toEqual({ answered: 0, correct: 0 });
    });

    it('should show settings modal as false initially', () => {
      expect(service.showSettingsModal()).toBe(false);
    });
  });

  describe('API key management', () => {
    it('should return null when no API key is set', () => {
      expect(service.getApiKey()).toBeNull();
    });

    it('should save and retrieve API key', () => {
      service.setApiKey('test-api-key');
      expect(service.getApiKey()).toBe('test-api-key');
    });

    it('should remove API key when empty string is set', () => {
      service.setApiKey('test-key');
      service.setApiKey('');
      expect(service.getApiKey()).toBeNull();
    });

    it('should remove API key when whitespace-only string is set', () => {
      service.setApiKey('test-key');
      service.setApiKey('   ');
      expect(service.getApiKey()).toBeNull();
    });

    it('should persist API key to localStorage', () => {
      service.setApiKey('persistent-key');
      expect(localStorage.getItem(STORAGE_KEYS.API_KEY)).toBe('persistent-key');
    });
  });

  describe('saveAnswer', () => {
    const mockQuestion: ToeicQuestion = {
      id: 'q1',
      question: 'Test question?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      explanation: 'Test explanation',
      translation: 'Test translation',
      category: 'Grammar',
      difficulty: 'Medium',
    };

    beforeEach(() => {
      // Manually add question to cache
      (service as any).activeQuestionsMap.set(mockQuestion.id, mockQuestion);
    });

    it('should save a correct answer and update stats', () => {
      service.saveAnswer('q1', 0); // correct

      const stats = service.stats();
      expect(stats.totalAnswered).toBe(1);
      expect(stats.totalCorrect).toBe(1);
      expect(stats.totalIncorrect).toBe(0);
      expect(stats.history).toHaveLength(1);
      expect(stats.history[0].isCorrect).toBe(true);
      expect(stats.history[0].questionId).toBe('q1');
    });

    it('should save an incorrect answer and update stats', () => {
      service.saveAnswer('q1', 1); // incorrect

      const stats = service.stats();
      expect(stats.totalAnswered).toBe(1);
      expect(stats.totalCorrect).toBe(0);
      expect(stats.totalIncorrect).toBe(1);
      expect(stats.history[0].isCorrect).toBe(false);
    });

    it('should update category stats correctly', () => {
      service.saveAnswer('q1', 0);

      const grammarStats = service.stats().categoryStats['Grammar'];
      expect(grammarStats.answered).toBe(1);
      expect(grammarStats.correct).toBe(1);
    });

    it('should update an existing answer instead of adding duplicate', () => {
      service.saveAnswer('q1', 0); // correct
      expect(service.stats().totalCorrect).toBe(1);

      service.saveAnswer('q1', 1); // change to incorrect
      const stats = service.stats();
      expect(stats.totalAnswered).toBe(1); // still 1 unique question
      expect(stats.totalCorrect).toBe(0);
      expect(stats.totalIncorrect).toBe(1);
      expect(stats.history).toHaveLength(1);
    });

    it('should persist stats to localStorage', () => {
      service.saveAnswer('q1', 0);
      const storedData = localStorage.getItem(STORAGE_KEYS.STATS);
      expect(storedData).not.toBeNull();
      const parsed = JSON.parse(storedData!);
      expect(parsed.totalAnswered).toBe(1);
      expect(parsed.totalCorrect).toBe(1);
    });

    it('should handle unknown question gracefully', () => {
      // Should not throw
      service.saveAnswer('non-existent-id', 0);
      expect(service.stats().totalAnswered).toBe(0);
    });

    it('should generate question text for Part 5 questions', () => {
      service.saveAnswer('q1', 0);
      expect(service.stats().history[0].questionText).toBe('Test question?');
    });

    it('should mark history entry with timestamp', () => {
      const before = Date.now();
      service.saveAnswer('q1', 0);
      const after = Date.now();
      const timestamp = service.stats().history[0].timestamp;
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('saveAnswer with Part 6 questions', () => {
    it('should handle Part 6 questions without "question" property', () => {
      const part6Question = {
        id: 'p6-q1',
        questionNumber: 131,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 2,
        explanation: 'Part 6 explanation',
        category: 'Vocabulary' as const,
      };
      (service as any).activeQuestionsMap.set(part6Question.id, part6Question);

      service.saveAnswer('p6-q1', 2);
      const stats = service.stats();
      expect(stats.totalAnswered).toBe(1);
      expect(stats.totalCorrect).toBe(1);
      expect(stats.history[0].questionText).toBe('Part 6 - Câu 131');
    });
  });

  describe('saveAnswer with Part 7 questions', () => {
    it('should handle Part 7 questions with passage category', () => {
      const part7Question = {
        id: 'p7-q147',
        questionNumber: 147,
        question: 'Part 7 test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 1,
        explanation: 'Part 7 explanation',
        translation: 'Part 7 translation',
        category: 'Single Passage',
      };
      (service as any).activeQuestionsMap.set(part7Question.id, part7Question);

      service.saveAnswer('p7-q147', 1);
      const stats = service.stats();
      expect(stats.totalAnswered).toBe(1);
      expect(stats.totalCorrect).toBe(1);
      expect(stats.history[0].questionText).toBe('Part 7 - Câu 147: Part 7 test question?');
    });
  });

  describe('resetStats', () => {
    it('should reset all stats to default', () => {
      // Set up some stats first
      const mockQ: ToeicQuestion = {
        id: 'q1',
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: '',
        translation: '',
        category: 'Grammar',
        difficulty: 'Medium',
      };
      (service as any).activeQuestionsMap.set(mockQ.id, mockQ);
      service.saveAnswer('q1', 0);

      service.resetStats();

      const stats = service.stats();
      expect(stats.totalAnswered).toBe(0);
      expect(stats.totalCorrect).toBe(0);
      expect(stats.totalIncorrect).toBe(0);
      expect(stats.history).toEqual([]);
    });

    it('should clear stats from localStorage', () => {
      const mockQ: ToeicQuestion = {
        id: 'q1',
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: '',
        translation: '',
        category: 'Grammar',
        difficulty: 'Medium',
      };
      (service as any).activeQuestionsMap.set(mockQ.id, mockQ);
      service.saveAnswer('q1', 0);
      service.resetStats();

      const storedData = localStorage.getItem(STORAGE_KEYS.STATS);
      expect(storedData).not.toBeNull();
      const parsed = JSON.parse(storedData!);
      expect(parsed.totalAnswered).toBe(0);
    });
  });

  describe('getQuestions / getQuestionById', () => {
    it('should return empty array when no questions cached', () => {
      expect(service.getQuestions()).toEqual([]);
    });

    it('should return cached questions', () => {
      const q: ToeicQuestion = {
        id: 'q1',
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: '',
        translation: '',
        category: 'Grammar',
        difficulty: 'Medium',
      };
      (service as any).activeQuestionsMap.set('q1', q);

      expect(service.getQuestions()).toHaveLength(1);
      expect(service.getQuestionById('q1')).toBe(q);
    });

    it('should return undefined for non-existent question', () => {
      expect(service.getQuestionById('non-existent')).toBeUndefined();
    });
  });

  describe('loadPracticeQuestions', () => {
    it('should throw error when no API key is set', async () => {
      await expect(service.loadPracticeQuestions(5)).rejects.toThrow('API Key');
    });

    it('should throw error when OmniRoute service fails', async () => {
      service.setApiKey('fake-key');
      (omnirouteServiceMock.generateToeicQuestions as any).mockRejectedValue(new Error('API Error'));

      await expect(service.loadPracticeQuestions(5)).rejects.toThrow('OmniRoute API');
    });

    it('should throw error when OmniRoute returns empty array', async () => {
      service.setApiKey('fake-key');
      (omnirouteServiceMock.generateToeicQuestions as any).mockResolvedValue([]);

      await expect(service.loadPracticeQuestions(5)).rejects.toThrow('Không thể kết nối');
    });

    it('should cache and return questions on success', async () => {
      const mockQuestions: ToeicQuestion[] = [
        {
          id: 'g-q1',
          question: 'Q1?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'E1',
          translation: 'T1',
          category: 'Grammar',
          difficulty: 'Easy',
        },
      ];
      service.setApiKey('fake-key');
      (omnirouteServiceMock.generateToeicQuestions as any).mockResolvedValue(mockQuestions);

      const result = await service.loadPracticeQuestions(1);
      expect(result).toHaveLength(1);
      // Should have generated unique IDs
      expect(result[0].id).not.toBe('g-q1');
      expect(result[0].id).toContain('g-q1');
      // Should be cached
      expect(service.getQuestionById(result[0].id)).toBeDefined();
    });
  });

  describe('loadPart6Passages', () => {
    it('should throw error when no API key is set', async () => {
      await expect(service.loadPart6Passages(1)).rejects.toThrow('API Key');
    });

    it('should cache questions from passages on success', async () => {
      const mockPassages = [
        {
          id: 'p6-p1',
          text: 'Text with [131] gap.',
          translation: 'Translation',
          questions: [
            {
              id: 'p6-p1-q1',
              questionNumber: 131,
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 0,
              explanation: 'E',
              category: 'Grammar' as const,
            },
          ],
        },
      ];
      service.setApiKey('fake-key');
      (omnirouteServiceMock.generateToeicPart6Passages as any).mockResolvedValue(mockPassages);

      const result = await service.loadPart6Passages(1);
      expect(result).toHaveLength(1);
      expect(result[0].questions).toHaveLength(1);
    });
  });

  describe('loadPart7Passages', () => {
    it('should throw error when no API key is set', async () => {
      await expect(service.loadPart7Passages(false)).rejects.toThrow('API Key');
    });

    it('should cache questions for mini test on success', async () => {
      const mockSinglePassage = {
        id: 'p7-s1',
        passageType: 'Single' as const,
        documentType: 'Email',
        text: 'Email text',
        translation: 'Translation',
        questions: [
          {
            id: 'p7-q147',
            questionNumber: 147,
            question: 'Q?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            explanation: 'E',
            translation: 'T',
          },
        ],
      };
      const mockDoublePassage = {
        id: 'p7-d1',
        passageType: 'Double' as const,
        documentType: 'Email',
        text: 'Double text',
        translation: 'Translation',
        questions: [
          {
            id: 'p7-q150',
            questionNumber: 150,
            question: 'Q?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 1,
            explanation: 'E',
            translation: 'T',
          },
        ],
      };

      service.setApiKey('fake-key');
      (omnirouteServiceMock.generateToeicPart7Passages as any)
        .mockResolvedValueOnce([mockSinglePassage])
        .mockResolvedValueOnce([mockDoublePassage]);

      const result = await service.loadPart7Passages(false);
      expect(result).toHaveLength(2);
    });

    it('should load 15 passages for full mock test', async () => {
      service.setApiKey('fake-key');

      const makePassage = (type: 'Single' | 'Double' | 'Triple', count: number) =>
        Array.from({ length: count }, (_, i) => ({
          id: `p7-${type}-${i}`,
          passageType: type,
          documentType: 'Email',
          text: `${type} text ${i}`,
          translation: 'Translation',
          questions: [
            {
              id: `p7-q${i}`,
              questionNumber: 147 + i,
              question: 'Q?',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 0,
              explanation: 'E',
              translation: 'T',
            },
          ],
        }));

      (omnirouteServiceMock.generateToeicPart7Passages as any)
        .mockResolvedValueOnce(makePassage('Single', 5))
        .mockResolvedValueOnce(makePassage('Single', 5))
        .mockResolvedValueOnce(makePassage('Double', 2))
        .mockResolvedValueOnce(makePassage('Triple', 3));

      const result = await service.loadPart7Passages(true);
      expect(result).toHaveLength(15);
    });
  });

  describe('stats loading from localStorage', () => {
    it('should restore stats from localStorage on init', () => {
      const savedStats: UserStats = {
        totalAnswered: 10,
        totalCorrect: 7,
        totalIncorrect: 3,
        categoryStats: {
          Grammar: { answered: 5, correct: 4 },
          Vocabulary: { answered: 5, correct: 3 },
          'Word Forms': { answered: 0, correct: 0 },
          'Sentence Insertion': { answered: 0, correct: 0 },
          'Single Passage': { answered: 0, correct: 0 },
          'Double Passage': { answered: 0, correct: 0 },
          'Triple Passage': { answered: 0, correct: 0 },
        },
        history: [
          {
            questionId: 'q1',
            questionText: 'Test?',
            selectedAnswer: 0,
            correctAnswer: 0,
            isCorrect: true,
            timestamp: Date.now(),
          },
        ],
      };
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(savedStats));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ToeicService,
          { provide: OmnirouteService, useValue: omnirouteServiceMock },
        ],
      });
      const newService = TestBed.inject(ToeicService);
      const stats = newService.stats();
      expect(stats.totalAnswered).toBe(10);
      expect(stats.totalCorrect).toBe(7);
    });

    it('should migrate old stats missing new categories', () => {
      const oldStats = {
        totalAnswered: 5,
        totalCorrect: 3,
        totalIncorrect: 2,
        categoryStats: {
          Grammar: { answered: 5, correct: 3 },
        },
        history: [],
      };
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(oldStats));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ToeicService,
          { provide: OmnirouteService, useValue: omnirouteServiceMock },
        ],
      });
      const newService = TestBed.inject(ToeicService);
      const stats = newService.stats();
      expect(stats.categoryStats['Sentence Insertion']).toEqual({ answered: 0, correct: 0 });
      expect(stats.categoryStats['Single Passage']).toEqual({ answered: 0, correct: 0 });
      expect(stats.categoryStats['Double Passage']).toEqual({ answered: 0, correct: 0 });
      expect(stats.categoryStats['Triple Passage']).toEqual({ answered: 0, correct: 0 });
    });

    it('should return default stats when localStorage data is corrupt', () => {
      localStorage.setItem(STORAGE_KEYS.STATS, 'not-valid-json');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ToeicService,
          { provide: OmnirouteService, useValue: omnirouteServiceMock },
        ],
      });
      const newService = TestBed.inject(ToeicService);
      const stats = newService.stats();
      expect(stats.totalAnswered).toBe(0);
      expect(stats.totalCorrect).toBe(0);
    });
  });

  describe('showSettingsModal', () => {
    it('should be settable', () => {
      service.showSettingsModal.set(true);
      expect(service.showSettingsModal()).toBe(true);

      service.showSettingsModal.set(false);
      expect(service.showSettingsModal()).toBe(false);
    });
  });
});