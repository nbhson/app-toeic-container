export const EMPTY_STRING = '';

export const STORAGE_KEYS = {
  STATS: 'toeic_part5_stats',
  GEMINI_API_KEY: 'gemini_api_key',
  OMNIROUTE_API_KEY: 'omniroute_api_key',
  THEME: 'toeic_theme',
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

export const GEMINI_CONFIG = {
  MODEL: 'gemini-2.5-flash',
  API_BASE_URL: 'https://generativelanguage.googleapis.com',
} as const;

export const OMNIROUTE_CONFIG = {
  MODEL: 'oc/deepseek-v4-flash-free',
  API_BASE_URL: 'http://localhost:20128/v1',
  UI_STUDIO_URL: 'http://localhost:20128',
} as const;

export const BE_API_URL = 'http://localhost:3000/api/toeic';
export const BE_KEYS_URL = 'http://localhost:3000/api/toeic/keys';
export const BE_STATS_URL = 'http://localhost:3000/api/toeic/stats';

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
