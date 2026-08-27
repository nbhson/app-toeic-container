import { describe, it, expect } from 'vitest';
import { buildPart5Prompt, buildPart6Prompt, buildPart7Prompt } from '../toeic.prompts.js';

describe('toeic.prompts', () => {
  describe('buildPart5Prompt', () => {
    it('includes the requested count', () => {
      const prompt = buildPart5Prompt(10);
      expect(prompt).toContain('10');
    });

    it('contains Part 5 reference', () => {
      const prompt = buildPart5Prompt(5);
      expect(prompt).toContain('Part 5');
    });

    it('mentions required categories', () => {
      const prompt = buildPart5Prompt(5);
      expect(prompt).toContain('Grammar');
      expect(prompt).toContain('Vocabulary');
      expect(prompt).toContain('Word Forms');
    });

    it('includes JSON structure instructions', () => {
      const prompt = buildPart5Prompt(5);
      expect(prompt).toContain('"questions"');
      expect(prompt).toContain('"correctAnswer"');
      expect(prompt).toContain('"explanation"');
      expect(prompt).toContain('"translation"');
      expect(prompt).toContain('"category"');
      expect(prompt).toContain('"difficulty"');
    });
  });

  describe('buildPart6Prompt', () => {
    it('includes the requested count', () => {
      const prompt = buildPart6Prompt(3);
      expect(prompt).toContain('3');
    });

    it('contains Part 6 reference', () => {
      const prompt = buildPart6Prompt(2);
      expect(prompt).toContain('Part 6');
    });

    it('mentions blank placeholders', () => {
      const prompt = buildPart6Prompt(1);
      expect(prompt).toContain('[131]');
      expect(prompt).toContain('[132]');
    });

    it('mentions all required categories', () => {
      const prompt = buildPart6Prompt(1);
      expect(prompt).toContain('Grammar');
      expect(prompt).toContain('Vocabulary');
      expect(prompt).toContain('Word Forms');
      expect(prompt).toContain('Sentence Insertion');
    });

    it('includes JSON structure with passages', () => {
      const prompt = buildPart6Prompt(1);
      expect(prompt).toContain('"passages"');
      expect(prompt).toContain('"text"');
      expect(prompt).toContain('"questions"');
    });
  });

  describe('buildPart7Prompt', () => {
    it('includes passage type, count, and start number', () => {
      const prompt = buildPart7Prompt('Single', 3, 147);
      expect(prompt).toContain('Single');
      expect(prompt).toContain('3');
      expect(prompt).toContain('147');
    });

    it('contains Part 7 reference', () => {
      const prompt = buildPart7Prompt('Double', 1, 176);
      expect(prompt).toContain('Part 7');
    });

    it('mentions passage types', () => {
      const singlePrompt = buildPart7Prompt('Single', 1, 147);
      expect(singlePrompt).toContain('Single Passage');

      const doublePrompt = buildPart7Prompt('Double', 1, 176);
      expect(doublePrompt).toContain('Double Passage');

      const triplePrompt = buildPart7Prompt('Triple', 1, 186);
      expect(triplePrompt).toContain('Triple Passage');
    });

    it('includes JSON structure for passages', () => {
      const prompt = buildPart7Prompt('Single', 1, 147);
      expect(prompt).toContain('"passages"');
      expect(prompt).toContain('"passageType"');
      expect(prompt).toContain('"documentType"');
      expect(prompt).toContain('"translation"');
    });

    it('includes correct startQuestionNumber in template', () => {
      const prompt = buildPart7Prompt('Single', 2, 147);
      expect(prompt).toContain('"questionNumber": 147');
    });
  });
});