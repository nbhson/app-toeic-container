import { describe, it, expect } from 'vitest';
import { validatePart5, validatePart6, validatePart7 } from '../toeic.validate.js';

function part5Question(i) {
  return {
    id: `q${i + 1}`,
    question: `Please submit the report _______ Friday. (${i})`,
    options: ['in', 'on', 'at', 'by'],
    correctAnswer: i % 4,
    translation: 'bản dịch',
    explanation: 'giải thích',
    category: ['Grammar', 'Vocabulary', 'Word Forms'][i % 3],
    difficulty: ['Easy', 'Medium', 'Hard'][i % 3],
  };
}

describe('validatePart5', () => {
  it('accepts a valid batch', () => {
    const result = { questions: [0, 1, 2, 3].map(part5Question) };
    expect(() => validatePart5(result, 4)).not.toThrow();
  });

  it('rejects wrong count', () => {
    expect(() => validatePart5({ questions: [part5Question(0)] }, 3)).toThrow(/exactly 3/);
  });

  it('rejects missing blank marker', () => {
    const q = { ...part5Question(0), question: 'No blank here' };
    expect(() => validatePart5({ questions: [q] }, 1)).toThrow(/blank/);
  });

  it('rejects duplicate options', () => {
    const q = { ...part5Question(0), options: ['by', 'by', 'at', 'on'] };
    expect(() => validatePart5({ questions: [q] }, 1)).toThrow(/duplicate/i);
  });

  it('rejects out-of-range correctAnswer', () => {
    const q = { ...part5Question(0), correctAnswer: 7 };
    expect(() => validatePart5({ questions: [q] }, 1)).toThrow(/correctAnswer/);
  });

  it('rejects degenerate batch with identical answers', () => {
    const result = { questions: [0, 1, 2, 3].map((i) => ({ ...part5Question(i), correctAnswer: 2 })) };
    expect(() => validatePart5(result, 4)).toThrow(/degenerate/);
  });
});

function part6Passage(idx) {
  const base = 131 + idx * 4;
  return {
    id: `p6-p${idx + 1}`,
    text: `Memo ${idx} _______ [${base}] text _______ [${base + 1}] more _______ [${base + 2}] end _______ [${base + 3}].`,
    translation: 'bản dịch',
    questions: [
      { id: `q${idx}a`, options: ['a1', 'a2', 'a3', 'a4'], correctAnswer: 0, explanation: 'gt', category: 'Grammar' },
      { id: `q${idx}b`, options: ['b1', 'b2', 'b3', 'b4'], correctAnswer: 1, explanation: 'gt', category: 'Vocabulary' },
      { id: `q${idx}c`, options: ['c1', 'c2', 'c3', 'c4'], correctAnswer: 2, explanation: 'gt', category: 'Word Forms' },
      { id: `q${idx}d`, options: ['Full sentence one here.', 'Full sentence two here.', 'Full sentence three here.', 'Full sentence four here.'], correctAnswer: 3, explanation: 'gt', category: 'Sentence Insertion' },
    ],
  };
}

describe('validatePart6', () => {
  it('accepts valid passages with sequential blanks', () => {
    expect(() => validatePart6({ passages: [part6Passage(0), part6Passage(1)] }, 2)).not.toThrow();
  });

  it('rejects non-sequential blank numbers', () => {
    const p = { ...part6Passage(0), text: 'Bad _______ [131] text _______ [132] more _______ [133] end _______ [140].' };
    expect(() => validatePart6({ passages: [p] }, 1)).toThrow(/sequential/);
  });

  it('rejects passages missing sentence insertion', () => {
    const p = part6Passage(0);
    p.questions = p.questions.map((q) => ({ ...q, category: 'Grammar' }));
    expect(() => validatePart6({ passages: [p] }, 1)).toThrow(/Sentence Insertion/);
  });
});

function part7Set(type, start, n) {
  return {
    id: 'p7-set-1',
    passageType: type,
    documentType: 'Email',
    text: 'Some passage text.',
    translation: 'bản dịch',
    questions: Array.from({ length: n }, (_, i) => ({
      id: `q${start + i}`,
      questionNumber: start + i,
      question: `Question ${start + i}?`,
      options: [`opt${i}a`, `opt${i}b`, `opt${i}c`, `opt${i}d`],
      correctAnswer: i % 4,
      explanation: 'giải thích',
      translation: 'dịch',
    })),
  };
}

describe('validatePart7', () => {
  it('accepts a valid Single set with sequential numbering', () => {
    expect(() => validatePart7({ passages: [part7Set('Single', 147, 3)] }, 'Single', 1, 147)).not.toThrow();
  });

  it('rejects Double sets without exactly 5 questions', () => {
    expect(() => validatePart7({ passages: [part7Set('Double', 176, 3)] }, 'Double', 1, 176)).toThrow(/exactly 5/);
  });

  it('rejects gaps in question numbering', () => {
    const set = part7Set('Single', 147, 3);
    set.questions[1].questionNumber = 999;
    expect(() => validatePart7({ passages: [set] }, 'Single', 1, 147)).toThrow(/questionNumber/);
  });

  it('rejects wrong passageType', () => {
    expect(() => validatePart7({ passages: [part7Set('Double', 176, 5)] }, 'Single', 1, 176)).toThrow(/passageType/);
  });
});
