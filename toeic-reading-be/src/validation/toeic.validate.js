/**
 * Validators for AI-generated TOEIC payloads.
 * Every generator response is checked BEFORE it reaches the client so a
 * malformed model reply becomes a retriable error instead of a UI crash.
 * All functions throw a descriptive Error on failure and return the
 * (lightly normalized) payload on success.
 */

const PART5_CATEGORIES = ['Grammar', 'Vocabulary', 'Word Forms'];
const PART6_CATEGORIES = ['Grammar', 'Vocabulary', 'Word Forms', 'Sentence Insertion'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function checkOptions(options, label, errors) {
  if (!Array.isArray(options) || options.length !== 4) {
    errors.push(`${label}: options must be an array of exactly 4 strings`);
    return;
  }
  const seen = new Set();
  options.forEach((opt, i) => {
    if (!isNonEmptyString(opt)) {
      errors.push(`${label}: options[${i}] must be a non-empty string`);
    } else {
      const key = opt.trim().toLowerCase();
      if (seen.has(key)) errors.push(`${label}: options[${i}] is a duplicate ("${opt.trim()}")`);
      seen.add(key);
    }
  });
}

function checkCorrectAnswer(value, label, errors) {
  if (!Number.isInteger(value) || value < 0 || value > 3) {
    errors.push(`${label}: correctAnswer must be an integer 0-3`);
  }
}

/**
 * Validates a Part 5 payload: { questions: [...] }.
 * @param {object} result - Parsed model JSON.
 * @param {number} count - Expected number of questions.
 * @returns {object} The validated payload.
 */
export function validatePart5(result, count) {
  const errors = [];
  if (!result || typeof result !== 'object') throw new Error('Part 5 validation failed: response is not an object.');
  if (!Array.isArray(result.questions)) throw new Error('Part 5 validation failed: missing "questions" array.');
  if (result.questions.length !== count) {
    errors.push(`expected exactly ${count} questions, got ${result.questions.length}`);
  }
  const answerBalance = [0, 0, 0, 0];
  result.questions.forEach((q, i) => {
    const label = `questions[${i}]`;
    if (!q || typeof q !== 'object') {
      errors.push(`${label}: must be an object`);
      return;
    }
    if (!isNonEmptyString(q.id)) errors.push(`${label}: id must be a non-empty string`);
    if (!isNonEmptyString(q.question) || !q.question.includes('_______')) {
      errors.push(`${label}: question must contain a '_______' blank`);
    }
    checkOptions(q.options, label, errors);
    checkCorrectAnswer(q.correctAnswer, label, errors);
    if (Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer <= 3) {
      answerBalance[q.correctAnswer] += 1;
    }
    if (!isNonEmptyString(q.translation)) errors.push(`${label}: translation is required`);
    if (!isNonEmptyString(q.explanation)) errors.push(`${label}: explanation is required`);
    if (!PART5_CATEGORIES.includes(q.category)) {
      errors.push(`${label}: category must be one of ${PART5_CATEGORIES.join(', ')}`);
    }
    if (!DIFFICULTIES.includes(q.difficulty)) {
      errors.push(`${label}: difficulty must be one of ${DIFFICULTIES.join(', ')}`);
    }
  });
  // Soft anti-pattern check: all answers identical is almost certainly a degenerate batch.
  if (result.questions.length >= 4 && answerBalance.some((n) => n === result.questions.length)) {
    errors.push('all questions share the same correctAnswer index (degenerate batch)');
  }
  if (errors.length > 0) {
    throw new Error(`Part 5 validation failed (${errors.length}): ${errors.slice(0, 8).join('; ')}`);
  }
  return result;
}

/**
 * Validates a Part 6 payload: { passages: [...] } with sequential [131...] blanks.
 * @param {object} result - Parsed model JSON.
 * @param {number} count - Expected number of passages.
 * @returns {object} The validated payload.
 */
export function validatePart6(result, count) {
  const errors = [];
  if (!result || typeof result !== 'object') throw new Error('Part 6 validation failed: response is not an object.');
  if (!Array.isArray(result.passages)) throw new Error('Part 6 validation failed: missing "passages" array.');
  if (result.passages.length !== count) {
    errors.push(`expected exactly ${count} passages, got ${result.passages.length}`);
  }
  const expectedFirst = 131;
  result.passages.forEach((p, i) => {
    const label = `passages[${i}]`;
    if (!p || typeof p !== 'object') {
      errors.push(`${label}: must be an object`);
      return;
    }
    if (!isNonEmptyString(p.id)) errors.push(`${label}: id must be a non-empty string`);
    if (!isNonEmptyString(p.text)) {
      errors.push(`${label}: text is required`);
    } else {
      const markers = [...p.text.matchAll(/\[(\d+)\]/g)].map((m) => parseInt(m[1], 10));
      const expected = [0, 1, 2, 3].map((k) => expectedFirst + i * 4 + k);
      if (markers.length !== 4) {
        errors.push(`${label}: text must contain exactly 4 numbered blanks, found ${markers.length}`);
      } else if (markers.some((n, k) => n !== expected[k])) {
        errors.push(`${label}: blanks must be sequential [${expected.join('], [')}], found [${markers.join('], [')}]`);
      }
    }
    if (!isNonEmptyString(p.translation)) errors.push(`${label}: translation is required`);
    if (!Array.isArray(p.questions) || p.questions.length !== 4) {
      errors.push(`${label}: must contain exactly 4 questions`);
      return;
    }
    const cats = new Set();
    p.questions.forEach((q, j) => {
      const qlabel = `${label}.questions[${j}]`;
      if (!q || typeof q !== 'object') {
        errors.push(`${qlabel}: must be an object`);
        return;
      }
      checkOptions(q.options, qlabel, errors);
      checkCorrectAnswer(q.correctAnswer, qlabel, errors);
      if (!isNonEmptyString(q.explanation)) errors.push(`${qlabel}: explanation is required`);
      if (!PART6_CATEGORIES.includes(q.category)) {
        errors.push(`${qlabel}: category must be one of ${PART6_CATEGORIES.join(', ')}`);
      } else {
        cats.add(q.category);
      }
    });
    if (!cats.has('Sentence Insertion')) errors.push(`${label}: must include exactly 1 Sentence Insertion question`);
    if (!cats.has('Grammar') || !cats.has('Vocabulary') || !cats.has('Word Forms')) {
      errors.push(`${label}: must cover Grammar, Vocabulary and Word Forms`);
    }
  });
  if (errors.length > 0) {
    throw new Error(`Part 6 validation failed (${errors.length}): ${errors.slice(0, 8).join('; ')}`);
  }
  return result;
}

/**
 * Validates a Part 7 payload: { passages: [...] }.
 * @param {object} result - Parsed model JSON.
 * @param {string} passageType - 'Single' | 'Double' | 'Triple'.
 * @param {number} count - Expected number of passage sets.
 * @param {number} startQuestionNumber - First question number.
 * @returns {object} The validated payload.
 */
export function validatePart7(result, passageType, count, startQuestionNumber) {
  const errors = [];
  if (!result || typeof result !== 'object') throw new Error('Part 7 validation failed: response is not an object.');
  if (!Array.isArray(result.passages)) throw new Error('Part 7 validation failed: missing "passages" array.');
  if (result.passages.length !== count) {
    errors.push(`expected exactly ${count} passages, got ${result.passages.length}`);
  }
  let expectedNumber = startQuestionNumber;
  result.passages.forEach((p, i) => {
    const label = `passages[${i}]`;
    if (!p || typeof p !== 'object') {
      errors.push(`${label}: must be an object`);
      return;
    }
    if (p.passageType !== passageType) {
      errors.push(`${label}: passageType must be "${passageType}", got "${p.passageType}"`);
    }
    if (!isNonEmptyString(p.text)) errors.push(`${label}: text is required`);
    if (!isNonEmptyString(p.translation)) errors.push(`${label}: translation is required`);
    if (!Array.isArray(p.questions) || p.questions.length === 0) {
      errors.push(`${label}: must contain at least 1 question`);
      return;
    }
    if (passageType === 'Single' && (p.questions.length < 2 || p.questions.length > 4)) {
      errors.push(`${label}: Single passage must have 2-4 questions, got ${p.questions.length}`);
    }
    if ((passageType === 'Double' || passageType === 'Triple') && p.questions.length !== 5) {
      errors.push(`${label}: ${passageType} passage must have exactly 5 questions, got ${p.questions.length}`);
    }
    p.questions.forEach((q) => {
      const qlabel = `${label} Q${expectedNumber}`;
      if (!q || typeof q !== 'object') {
        errors.push(`${qlabel}: must be an object`);
      } else {
        if (q.questionNumber !== expectedNumber) {
          errors.push(`${qlabel}: questionNumber must be ${expectedNumber}, got ${q.questionNumber}`);
        }
        if (!isNonEmptyString(q.question)) errors.push(`${qlabel}: question text is required`);
        checkOptions(q.options, qlabel, errors);
        checkCorrectAnswer(q.correctAnswer, qlabel, errors);
        if (!isNonEmptyString(q.explanation)) errors.push(`${qlabel}: explanation is required`);
      }
      expectedNumber += 1;
    });
  });
  if (errors.length > 0) {
    throw new Error(`Part 7 validation failed (${errors.length}): ${errors.slice(0, 8).join('; ')}`);
  }
  return result;
}

export const PART5_CATEGORIES_LIST = PART5_CATEGORIES;
export const PART6_CATEGORIES_LIST = PART6_CATEGORIES;
