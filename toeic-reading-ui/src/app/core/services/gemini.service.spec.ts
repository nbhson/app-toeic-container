import { TestBed } from '@angular/core/testing';
import { GeminiService } from './gemini.service';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GeminiService', () => {
  let service: GeminiService;
  let httpClientMock: Partial<HttpClient>;

  beforeEach(() => {
    httpClientMock = {
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        GeminiService,
        { provide: HttpClient, useValue: httpClientMock },
      ],
    });
    service = TestBed.inject(GeminiService);
  });

  describe('generateToeicQuestions', () => {
    it('should return parsed questions on successful API call', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify([
                    {
                      id: 'g-q1',
                      question: 'Test question?',
                      options: ['A', 'B', 'C', 'D'],
                      correctAnswer: 0,
                      translation: 'Translation',
                      explanation: 'Explanation',
                      category: 'Grammar',
                      difficulty: 'Medium',
                    },
                  ]),
                },
              ],
            },
          },
        ],
      };

      (httpClientMock.post as any).mockReturnValue(of(mockResponse));

      const result = await service.generateToeicQuestions(1, 'fake-api-key');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('g-q1');
      expect(result[0].category).toBe('Grammar');
    });

    it('should throw error when API returns no candidates', async () => {
      const mockResponse = { candidates: [] };
      (httpClientMock.post as any).mockReturnValue(of(mockResponse));

      await expect(service.generateToeicQuestions(1, 'fake-key')).rejects.toThrow(
        'Không nhận được nội dung',
      );
    });

    it('should throw error when API returns no text', async () => {
      const mockResponse = {
        candidates: [{ content: { parts: [] } }],
      };
      (httpClientMock.post as any).mockReturnValue(of(mockResponse));

      await expect(service.generateToeicQuestions(1, 'fake-key')).rejects.toThrow(
        'Không nhận được nội dung',
      );
    });

    it('should throw error when HTTP request fails', async () => {
      (httpClientMock.post as any).mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      await expect(service.generateToeicQuestions(1, 'fake-key')).rejects.toThrow();
    });

    it('should throw error when JSON parsing fails', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'not-valid-json' }],
            },
          },
        ],
      };
      (httpClientMock.post as any).mockReturnValue(of(mockResponse));

      await expect(service.generateToeicQuestions(1, 'fake-key')).rejects.toThrow();
    });

    it('should call the correct API endpoint', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: '[]' }],
            },
          },
        ],
      };
      (httpClientMock.post as any).mockReturnValue(of(mockResponse));

      await service.generateToeicQuestions(1, 'test-key');

      expect(httpClientMock.post).toHaveBeenCalledTimes(1);
      const [url, body, options] = (httpClientMock.post as any).mock.calls[0];
      expect(url).toContain('generativelanguage.googleapis.com');
      expect(url).toContain('gemini-2.5-flash');
      expect(url).toContain('key=test-key');
      expect(body.contents[0].parts[0].text).toContain('TOEIC Part 5');
      expect(options.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('generateToeicPart6Passages', () => {
    it('should return parsed passages on success', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify([
                    {
                      id: 'p6-p1',
                      text: 'Passage text with [131] gap.',
                      translation: 'Translation',
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
                  ]),
                },
              ],
            },
          },
        ],
      };

      (httpClientMock.post as any).mockReturnValue(of(mockResponse));

      const result = await service.generateToeicPart6Passages(1, 'fake-key');
      expect(result).toHaveLength(1);
      expect(result[0].text).toContain('[131]');
      expect(result[0].questions).toHaveLength(1);
    });
  });

  describe('generateToeicPart7Passages', () => {
    it('should return parsed passages on success', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify([
                    {
                      id: 'p7-s1',
                      passageType: 'Single',
                      documentType: 'Email',
                      text: 'Email content',
                      translation: 'Translation',
                      questions: [
                        {
                          id: 'p7-q147',
                          questionNumber: 147,
                          question: 'Test question?',
                          options: ['A', 'B', 'C', 'D'],
                          correctAnswer: 0,
                          explanation: 'Explanation',
                          translation: 'Question translation',
                        },
                      ],
                    },
                  ]),
                },
              ],
            },
          },
        ],
      };

      (httpClientMock.post as any).mockReturnValue(of(mockResponse));

      const result = await service.generateToeicPart7Passages('Single', 1, 147, 'fake-key');
      expect(result).toHaveLength(1);
      expect(result[0].passageType).toBe('Single');
      expect(result[0].questions[0].questionNumber).toBe(147);
    });

    it('should include passage type and start question number in prompt', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: '[]' }],
            },
          },
        ],
      };
      (httpClientMock.post as any).mockReturnValue(of(mockResponse));

      await service.generateToeicPart7Passages('Double', 2, 176, 'test-key');

      const body = (httpClientMock.post as any).mock.calls[0][1];
      const prompt = body.contents[0].parts[0].text;
      expect(prompt).toContain('Double');
      expect(prompt).toContain('176');
    });
  });
});