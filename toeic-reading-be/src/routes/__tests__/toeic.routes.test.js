import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock the omniroute service
vi.mock('../../services/omniroute.service.js', () => ({
  generateToeicQuestions: vi.fn(),
  generateToeicPart6Passages: vi.fn(),
  generateToeicPart7Passages: vi.fn(),
}));

// Mock the key-store module
vi.mock('../../db/key-store.js', () => ({
  getKey: vi.fn(),
  setKey: vi.fn(),
  listKeys: vi.fn(),
}));

const { generateToeicQuestions, generateToeicPart6Passages, generateToeicPart7Passages } = await import('../../services/omniroute.service.js');
const { getKey } = await import('../../db/key-store.js');

const toeicRoutes = (await import('../toeic.routes.js')).default;

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/toeic', toeicRoutes);
  return app;
}

describe('toeic.routes', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    // Default: no stored key
    getKey.mockReturnValue(null);
  });

  describe('POST /api/toeic/part5', () => {
    it('generates questions with provided apiKey', async () => {
      const mockQuestions = [{ id: 'q1', question: 'Test question' }];
      generateToeicQuestions.mockResolvedValue(mockQuestions);

      const res = await request(app)
        .post('/api/toeic/part5')
        .send({ count: 5, apiKey: 'test-key' });

      expect(res.status).toBe(200);
      expect(res.body.questions).toEqual(mockQuestions);
      expect(generateToeicQuestions).toHaveBeenCalledWith(5, 'test-key');
    });

    it('uses stored key when no apiKey provided', async () => {
      getKey.mockReturnValue('stored-key');
      generateToeicQuestions.mockResolvedValue([{ id: 'q1' }]);

      const res = await request(app)
        .post('/api/toeic/part5')
        .send({ count: 3 });

      expect(res.status).toBe(200);
      expect(generateToeicQuestions).toHaveBeenCalledWith(3, 'stored-key');
    });

    it('returns 400 when no apiKey is available', async () => {
      const res = await request(app)
        .post('/api/toeic/part5')
        .send({ count: 5 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('apiKey is required');
    });

    it('returns 400 when count is missing', async () => {
      const res = await request(app)
        .post('/api/toeic/part5')
        .send({ apiKey: 'test-key' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('count must be a positive number');
    });

    it('returns 400 when count is less than 1', async () => {
      const res = await request(app)
        .post('/api/toeic/part5')
        .send({ count: 0, apiKey: 'test-key' });

      expect(res.status).toBe(400);
    });

    it('returns 500 when generation fails', async () => {
      generateToeicQuestions.mockRejectedValue(new Error('API error'));

      const res = await request(app)
        .post('/api/toeic/part5')
        .send({ count: 5, apiKey: 'test-key' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('API error');
    });
  });

  describe('POST /api/toeic/part6', () => {
    it('generates passages with provided apiKey', async () => {
      const mockPassages = [{ id: 'p6-p1', text: 'Test passage', questions: [] }];
      generateToeicPart6Passages.mockResolvedValue(mockPassages);

      const res = await request(app)
        .post('/api/toeic/part6')
        .send({ count: 2, apiKey: 'test-key' });

      expect(res.status).toBe(200);
      expect(res.body.passages).toEqual(mockPassages);
      expect(generateToeicPart6Passages).toHaveBeenCalledWith(2, 'test-key');
    });

    it('returns 400 when no apiKey is available', async () => {
      const res = await request(app)
        .post('/api/toeic/part6')
        .send({ count: 2 });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/toeic/part7', () => {
    it('generates passages with valid parameters', async () => {
      const mockPassages = [{ id: 'p7-p-single-1', passageType: 'Single', questions: [] }];
      generateToeicPart7Passages.mockResolvedValue(mockPassages);

      const res = await request(app)
        .post('/api/toeic/part7')
        .send({
          passageType: 'Single',
          count: 1,
          startQuestionNumber: 147,
          apiKey: 'test-key',
        });

      expect(res.status).toBe(200);
      expect(res.body.passages).toEqual(mockPassages);
      expect(generateToeicPart7Passages).toHaveBeenCalledWith('Single', 1, 147, 'test-key');
    });

    it('returns 400 for invalid passageType', async () => {
      const res = await request(app)
        .post('/api/toeic/part7')
        .send({
          passageType: 'Invalid',
          count: 1,
          startQuestionNumber: 147,
          apiKey: 'test-key',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Single, Double, or Triple');
    });

    it('returns 400 when startQuestionNumber is missing', async () => {
      const res = await request(app)
        .post('/api/toeic/part7')
        .send({
          passageType: 'Single',
          count: 1,
          apiKey: 'test-key',
        });

      expect(res.status).toBe(400);
    });

    it('returns 400 when no apiKey is available', async () => {
      const res = await request(app)
        .post('/api/toeic/part7')
        .send({
          passageType: 'Double',
          count: 1,
          startQuestionNumber: 176,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/toeic/part7/batch', () => {
    it('generates all batches in a single request', async () => {
      const mockSingle = [{ id: 'p7-s1', passageType: 'Single', questions: [] }];
      const mockDouble = [{ id: 'p7-d1', passageType: 'Double', questions: [] }];
      generateToeicPart7Passages
        .mockResolvedValueOnce(mockSingle)
        .mockResolvedValueOnce(mockSingle)
        .mockResolvedValueOnce(mockDouble);

      const res = await request(app)
        .post('/api/toeic/part7/batch')
        .send({
          batches: [
            { passageType: 'Single', count: 1, startQuestionNumber: 147 },
            { passageType: 'Single', count: 1, startQuestionNumber: 158 },
            { passageType: 'Double', count: 1, startQuestionNumber: 176 },
          ],
          apiKey: 'test-key',
        });

      expect(res.status).toBe(200);
      expect(res.body.passages).toHaveLength(3);
      expect(generateToeicPart7Passages).toHaveBeenCalledTimes(3);
      expect(generateToeicPart7Passages).toHaveBeenCalledWith('Single', 1, 147, 'test-key');
      expect(generateToeicPart7Passages).toHaveBeenCalledWith('Single', 1, 158, 'test-key');
      expect(generateToeicPart7Passages).toHaveBeenCalledWith('Double', 1, 176, 'test-key');
    });

    it('uses stored key when no apiKey provided', async () => {
      getKey.mockReturnValue('stored-key');
      generateToeicPart7Passages.mockResolvedValue([{ id: 'p7-s1', passageType: 'Single', questions: [] }]);

      const res = await request(app)
        .post('/api/toeic/part7/batch')
        .send({
          batches: [
            { passageType: 'Single', count: 1, startQuestionNumber: 147 },
          ],
        });

      expect(res.status).toBe(200);
      expect(generateToeicPart7Passages).toHaveBeenCalledWith('Single', 1, 147, 'stored-key');
    });

    it('returns 400 when batches is empty', async () => {
      const res = await request(app)
        .post('/api/toeic/part7/batch')
        .send({ batches: [], apiKey: 'test-key' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('non-empty array');
    });

    it('returns 400 when batches is not an array', async () => {
      const res = await request(app)
        .post('/api/toeic/part7/batch')
        .send({ batches: 'invalid', apiKey: 'test-key' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid passageType in a batch', async () => {
      const res = await request(app)
        .post('/api/toeic/part7/batch')
        .send({
          batches: [
            { passageType: 'Invalid', count: 1, startQuestionNumber: 147 },
          ],
          apiKey: 'test-key',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Batch 0');
    });

    it('returns 400 when no apiKey is available', async () => {
      const res = await request(app)
        .post('/api/toeic/part7/batch')
        .send({
          batches: [
            { passageType: 'Single', count: 1, startQuestionNumber: 147 },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('returns 500 when a batch generation fails', async () => {
      generateToeicPart7Passages
        .mockResolvedValueOnce([{ id: 'p7-s1', passageType: 'Single', questions: [] }])
        .mockRejectedValueOnce(new Error('OmniRoute API error'));

      const res = await request(app)
        .post('/api/toeic/part7/batch')
        .send({
          batches: [
            { passageType: 'Single', count: 1, startQuestionNumber: 147 },
            { passageType: 'Double', count: 1, startQuestionNumber: 176 },
          ],
          apiKey: 'test-key',
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('OmniRoute API error');
    });
  });
});
