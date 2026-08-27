import { describe, it, expect } from 'vitest';
import { safeParseJSON } from '../omniroute.service.js';

describe('safeParseJSON', () => {
  it('parses valid JSON as-is', () => {
    const input = JSON.stringify({ questions: [{ id: 1 }] });
    const result = safeParseJSON(input);
    expect(result).toEqual({ questions: [{ id: 1 }] });
  });

  it('throws for empty/null/non-string input', () => {
    expect(() => safeParseJSON(null)).toThrow('Empty or non-string response');
    expect(() => safeParseJSON('')).toThrow('Empty or non-string response');
    expect(() => safeParseJSON(undefined)).toThrow('Empty or non-string response');
    expect(() => safeParseJSON(123)).toThrow('Empty or non-string response');
  });

  it('strips markdown code fences', () => {
    const input = '```json\n{"key": "value"}\n```';
    const result = safeParseJSON(input);
    expect(result).toEqual({ key: 'value' });
  });

  it('strips markdown fences without language tag', () => {
    const input = '```\n{"key": "value"}\n```';
    const result = safeParseJSON(input);
    expect(result).toEqual({ key: 'value' });
  });

  it('handles stray quotes after numbers', () => {
    const input = '{"questionNumber": 152", "count": 10"}';
    const result = safeParseJSON(input);
    expect(result).toEqual({ questionNumber: 152, count: 10 });
  });

  it('handles stray quotes after booleans', () => {
    const input = '{"enabled": true", "disabled": false"}';
    const result = safeParseJSON(input);
    expect(result).toEqual({ enabled: true, disabled: false });
  });

  it('handles stray quotes after null', () => {
    const input = '{"value": null"}';
    const result = safeParseJSON(input);
    expect(result).toEqual({ value: null });
  });

  it('handles trailing commas before closing braces', () => {
    const input = '{"a": 1, "b": 2,}';
    const result = safeParseJSON(input);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('handles trailing commas in arrays', () => {
    const input = '{"items": [1, 2, 3,]}';
    const result = safeParseJSON(input);
    expect(result).toEqual({ items: [1, 2, 3] });
  });

  it('escapes raw newlines inside string values', () => {
    const input = '{"text": "Hello\nWorld"}';
    const result = safeParseJSON(input);
    expect(result.text).toBe('Hello\nWorld');
  });

  it('escapes raw tabs inside string values', () => {
    const input = '{"text": "Hello\tWorld"}';
    const result = safeParseJSON(input);
    expect(result.text).toBe('Hello\tWorld');
  });

  it('removes null bytes inside string values', () => {
    const input = '{"text": "Hello\u0000World"}';
    const result = safeParseJSON(input);
    expect(result.text).toBe('HelloWorld');
  });

  it('handles complex AI-generated Part 7 JSON with mixed issues', () => {
    const input = JSON.stringify({
      passages: [
        {
          id: 'p7-q-152',
          passageType: 'Single',
          passage: 'Some passage about a notice for residents...',
          questions: [
            {
              id: 'q-152',
              questionNumber: 152,
              question: 'What should residents do?',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: 0,
              explanation: 'Test explanation',
            },
          ],
        },
      ],
    });
    const result = safeParseJSON(input);
    expect(result.passages).toHaveLength(1);
    expect(result.passages[0].questions[0].questionNumber).toBe(152);
  });

  it('throws with diagnostic info for truly unparseable input', () => {
    expect(() => safeParseJSON('{broken][json}')).toThrow('Invalid JSON from AI model');
  });
});