/**
 * Service that calls the OmniRoute API (OpenAI-compatible chat completions).
 * This logic was moved from the Angular UI's OmnirouteService.
 */

import { buildPart5Prompt, buildPart6Prompt, buildPart7Prompt } from '../prompts/toeic.prompts.js';

const OMNIROUTE_MODEL = process.env.OMNIROUTE_MODEL || 'oc/deepseek-v4-flash-free';
const OMNIROUTE_API_BASE_URL = process.env.OMNIROUTE_API_BASE_URL || 'http://localhost:20128/v1';
const REQUEST_TIMEOUT_MS = parseInt(process.env.OMNIROUTE_TIMEOUT_MS || '150000', 10); // 60s default

/**
 * Attempts to parse a JSON string, with automatic sanitization and repair for
 * common AI-generated JSON issues (markdown fences, control characters, etc.).
 */
function safeParseJSON(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Empty or non-string response received.');
  }

  let cleaned = raw.trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  // Try parsing as-is first
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall through to sanitization
  }

  // Remove unescaped control characters (except \n, \r, \t which are valid in strings
  // but we remove raw ones outside of string values)
  // Replace raw newlines/tabs INSIDE string values with escaped versions
  // This is a heuristic: walk char by char tracking string state
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\' && inString) {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString) {
      // Inside a string: escape raw control characters
      if (ch === '\n') {
        result += '\\n';
        continue;
      }
      if (ch === '\r') {
        result += '\\r';
        continue;
      }
      if (ch === '\t') {
        result += '\\t';
        continue;
      }
      // Remove other control characters (U+0000 to U+001F except tab, newline, carriage return)
      const code = ch.charCodeAt(0);
      if (code < 32) {
        continue; // Skip null and other control chars
      }
    }

    result += ch;
  }

  // Additional AI-specific fixes:
  // 1. Remove stray quotes after numbers: 152" → 152
  result = result.replace(/:\s*(\d+)"(?=[,\s}\]])/g, ': $1');
  // 2. Remove stray quotes after booleans/null: true" → true, false" → false, null" → null
  result = result.replace(/:\s*(true|false|null)"(?=[,\s}\]])/g, ': $1');
  // 3. Remove trailing commas before } or ]
  result = result.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(result);
  } catch (err) {
    // Last resort: log the problematic area for debugging
    const pos = parseInt(err.message.match(/position (\d+)/)?.[1], 10);
    if (!isNaN(pos)) {
      const start = Math.max(0, pos - 50);
      const end = Math.min(result.length, pos + 50);
      console.error(`[safeParseJSON] Parse failed near position ${pos}: "...${result.slice(start, end)}..."`);
    }
    throw new Error(`Invalid JSON from AI model. ${err.message}`);
  }
}

/**
 * Exported for unit testing.
 */
export { safeParseJSON };

/**
 * Calls the OmniRoute chat completions API with the given prompt and API key.
 * Includes a configurable timeout to prevent hanging requests.
 * @param {string} prompt - The user prompt to send.
 * @param {string} apiKey - The OmniRoute API key.
 * @returns {Promise<object>} - The parsed JSON response from the AI.
 */
async function generateContent(prompt, apiKey) {
  const url = `${OMNIROUTE_API_BASE_URL}/chat/completions`;

  const messages = [
    {
      role: 'system',
      content:
        'You are an expert TOEIC test creator. Always respond with valid JSON only, no markdown, no code blocks, no extra text.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const requestBody = {
    model: OMNIROUTE_MODEL,
    messages,
    temperature: 0.7,
    stream: false,
    response_format: { type: 'json_object' },
  };

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const statusHint =
        response.status === 502 ? ' (OmniRoute gateway may be down)' :
        response.status === 429 ? ' (Rate limited - too many requests)' :
        response.status === 503 ? ' (Service temporarily unavailable)' :
        '';
      throw new Error(`OmniRoute API error (${response.status})${statusHint}: ${errorText}`);
    }

    const rawText = await response.text();

    // Check if response is SSE (Server-Sent Events) format: starts with "data: "
    if (rawText.startsWith('data: ')) {
      // Parse SSE stream: concatenate all content deltas
      const lines = rawText.split('\n').filter(line => line.startsWith('data: '));
      let fullContent = '';

      for (const line of lines) {
        const jsonStr = line.slice(6); // Remove "data: " prefix
        if (jsonStr === '[DONE]') continue;
        try {
          const chunk = JSON.parse(jsonStr);
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) fullContent += delta;
        } catch {
          // Skip malformed chunks
        }
      }

      if (!fullContent) {
        throw new Error('Không nhận được nội dung trả về từ OmniRoute API (SSE stream).');
      }

      return safeParseJSON(fullContent);
    }

    // Standard JSON response
    const responseData = JSON.parse(rawText);
    const textResult = responseData.choices?.[0]?.message?.content;

    if (!textResult) {
      throw new Error('Không nhận được nội dung trả về từ OmniRoute API.');
    }

    return safeParseJSON(textResult);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`OmniRoute API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. The AI model may be overloaded - please try again.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generates TOEIC Part 5 questions.
 * @param {number} count
 * @param {string} apiKey
 * @returns {Promise<Array>}
 */
export async function generateToeicQuestions(count, apiKey) {
  const prompt = buildPart5Prompt(count);
  const result = await generateContent(prompt, apiKey);
  return result.questions;
}

/**
 * Generates TOEIC Part 6 passages.
 * @param {number} count
 * @param {string} apiKey
 * @returns {Promise<Array>}
 */
export async function generateToeicPart6Passages(count, apiKey) {
  const prompt = buildPart6Prompt(count);
  const result = await generateContent(prompt, apiKey);
  return result.passages;
}

/**
 * Generates TOEIC Part 7 passages.
 * @param {string} passageType - 'Single' | 'Double' | 'Triple'
 * @param {number} count
 * @param {number} startQuestionNumber
 * @param {string} apiKey
 * @returns {Promise<Array>}
 */
export async function generateToeicPart7Passages(passageType, count, startQuestionNumber, apiKey) {
  const prompt = buildPart7Prompt(passageType, count, startQuestionNumber);
  const result = await generateContent(prompt, apiKey);
  return result.passages;
}