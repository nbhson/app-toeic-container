import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { OmnirouteService } from './omniroute.service';
import { BE_API_URL } from '../constants/app.constants';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

describe('OmnirouteService', () => {
  let service: OmnirouteService;
  let httpClientMock: { post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpClientMock = { post: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        OmnirouteService,
        { provide: HttpClient, useValue: httpClientMock },
      ],
    });
    service = TestBed.inject(OmnirouteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateToeicQuestions', () => {
    it('should send request to BE API and return questions', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          question: 'The company ____ a new policy.',
          options: ['announced', 'announcing', 'announce', 'announces'],
          correctAnswer: 0,
          translation: 'Công ty đã thông báo chính sách mới.',
          explanation: 'Đáp án A đúng.',
          category: 'Grammar',
          difficulty: 'Medium',
        },
      ];

      httpClientMock.post.mockReturnValue(of({ questions: mockQuestions }));

      const result = await service.generateToeicQuestions(1, 'test-api-key');

      expect(httpClientMock.post).toHaveBeenCalledWith(`${BE_API_URL}/part5`, {
        count: 1,
        apiKey: 'test-api-key',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('q1');
      expect(result[0].category).toBe('Grammar');
    });

    it('should throw error on HTTP failure', async () => {
      httpClientMock.post.mockReturnValue({
        subscribe: ({ error }: { error: (e: Error) => void }) => {
          error(new Error('Network error'));
        },
      });

      // The service uses firstValueFrom which wraps Observable, so an error observable will reject
      httpClientMock.post.mockImplementation(() => {
        throw new Error('Network error');
      });

      await expect(service.generateToeicQuestions(1, 'test-api-key')).rejects.toThrow();
    });
  });

  describe('generateToeicPart6Passages', () => {
    it('should send request to BE API and return Part 6 passages', async () => {
      const mockPassages = [
        {
          id: 'p6-p1',
          text: 'Email content with [131] gap.',
          translation: 'Nội dung email với chỗ trống.',
          questions: [
            {
              id: 'p6-p1-q1',
              questionNumber: 131,
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 0,
              explanation: 'Explanation',
              category: 'Grammar',
            },
          ],
        },
      ];

      httpClientMock.post.mockReturnValue(of({ passages: mockPassages }));

      const result = await service.generateToeicPart6Passages(1, 'test-api-key');

      expect(httpClientMock.post).toHaveBeenCalledWith(`${BE_API_URL}/part6`, {
        count: 1,
        apiKey: 'test-api-key',
      });
      expect(result).toHaveLength(1);
      expect(result[0].questions).toHaveLength(1);
    });
  });

  describe('generateToeicPart7Passages', () => {
    it('should send request to BE API and return Part 7 passages with correct params', async () => {
      const mockPassages = [
        {
          id: 'p7-p-single-1',
          passageType: 'Single',
          documentType: 'Email',
          text: 'Email content',
          translation: 'Bản dịch',
          questions: [
            {
              id: 'p7-q147',
              questionNumber: 147,
              question: 'What is the purpose?',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 0,
              explanation: 'Explanation',
              translation: 'Dịch câu hỏi',
            },
          ],
        },
      ];

      httpClientMock.post.mockReturnValue(of({ passages: mockPassages }));

      const result = await service.generateToeicPart7Passages('Single', 1, 147, 'test-api-key');

      expect(httpClientMock.post).toHaveBeenCalledWith(`${BE_API_URL}/part7`, {
        passageType: 'Single',
        count: 1,
        startQuestionNumber: 147,
        apiKey: 'test-api-key',
      });
      expect(result).toHaveLength(1);
      expect(result[0].passageType).toBe('Single');
    });

    it('should send correct params for Double passage', async () => {
      httpClientMock.post.mockReturnValue(of({ passages: [] }));

      const result = await service.generateToeicPart7Passages('Double', 1, 150, 'test-api-key');

      expect(httpClientMock.post).toHaveBeenCalledWith(`${BE_API_URL}/part7`, {
        passageType: 'Double',
        count: 1,
        startQuestionNumber: 150,
        apiKey: 'test-api-key',
      });
      expect(result).toEqual([]);
    });

    it('should send correct params for Triple passage', async () => {
      httpClientMock.post.mockReturnValue(of({ passages: [] }));

      const result = await service.generateToeicPart7Passages('Triple', 1, 176, 'test-api-key');

      expect(httpClientMock.post).toHaveBeenCalledWith(`${BE_API_URL}/part7`, {
        passageType: 'Triple',
        count: 1,
        startQuestionNumber: 176,
        apiKey: 'test-api-key',
      });
      expect(result).toEqual([]);
    });
  });
});