export const EMPTY_STRING = '';

export const STORAGE_KEYS = {
  STATS: 'toeic_part5_stats',
  GEMINI_API_KEY: 'gemini_api_key',
  OMNIROUTE_API_KEY: 'omniroute_api_key',
  THEME: 'toeic_theme',
  NOTEBOOK_REVIEWED: 'toeic_notebook_reviewed',
} as const;

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  LIGHT_CLASS: 'light-theme',
  DARK_CLASS: 'dark-theme',
} as const;

export const CATEGORIES = {
  GRAMMAR: 'Grammar',
  VOCABULARY: 'Vocabulary',
  WORD_FORMS: 'Word Forms',
  SENTENCE_INSERTION: 'Sentence Insertion',
  SINGLE_PASSAGE: 'Single Passage',
  DOUBLE_PASSAGE: 'Double Passage',
  TRIPLE_PASSAGE: 'Triple Passage',
} as const;

export const DIFFICULTY_LEVELS = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
} as const;

// NOTE: Gemini model/API config lives server-side now (GEMINI_MODEL /
// GEMINI_API_BASE_URL in the BE .env); the UI only talks to the BE proxy.

export const OMNIROUTE_CONFIG = {
  MODEL: 'oc/deepseek-v4-flash-free',
  API_BASE_URL: (window as any).__env?.OMNIROUTE_API_URL || 'http://localhost:20128/v1',
  UI_STUDIO_URL: (window as any).__env?.OMNIROUTE_STUDIO_URL || 'http://localhost:20128',
} as const;

// Backend base URL is relative by default: same-origin `/api/...`, which the
// container's nginx proxies to the backend service (see nginx.conf), and the
// Angular dev server proxies for local development (see proxy.conf.json).
// Overridable at runtime via window.__env.BE_API_BASE_URL for exotic setups
// where the API lives on another origin (inject a small config script before
// the app bundle). No trailing slash — paths below append `/api/...`.
const BE_BASE_URL: string = (window as any).__env?.BE_API_BASE_URL || '';

export const BE_API_URL = `${BE_BASE_URL}/api/toeic`;
export const BE_KEYS_URL = `${BE_BASE_URL}/api/toeic/keys`;
export const BE_STATS_URL = `${BE_BASE_URL}/api/toeic/stats`;
export const BE_BANK_URL = `${BE_BASE_URL}/api/toeic/bank`;
export const BE_READING_TEST_URL = `${BE_BASE_URL}/api/toeic/reading-test`;
export const BE_NOTEBOOK_URL = `${BE_BASE_URL}/api/toeic/notebook`;
export const BE_GEMINI_URL = `${BE_BASE_URL}/api/toeic/gemini/generate`;

/**
 * Generates or retrieves a persistent anonymous userId for stats tracking.
 * Stored in localStorage so it persists across sessions.
 */
export function getUserId(): string {
  if (typeof window === 'undefined') return 'default';
  const KEY = 'toeic_user_id';
  let userId = localStorage.getItem(KEY);
  if (!userId) {
    userId = 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(KEY, userId);
  }
  return userId;
}

/**
 * Determines the active AI provider based on available API keys.
 * Returns 'gemini' if only Gemini key is set, 'omniroute' if only OmniRoute key is set,
 * or 'omniroute' if both are set (OmniRoute takes priority as the newer provider).
 * Returns null if neither is configured.
 */
export type AIProvider = 'gemini' | 'omniroute';
