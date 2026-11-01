/**
 * Service that calls the Google Gemini API (generateContent).
 * The API key stays server-side: it is resolved from the environment or the
 * BE key store and sent via the `x-goog-api-key` header — never in a URL,
 * never in the response, never logged.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_BASE_URL = process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com';
const REQUEST_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS || '150000', 10);

/**
 * Calls the Gemini generateContent endpoint with the given request body.
 * @param {object} p
 * @param {Array} p.contents - Gemini `contents` array (UI-built prompt).
 * @param {object} [p.generationConfig] - Gemini generation config (responseSchema etc.).
 * @param {string} [p.model] - Model name override.
 * @param {string} p.apiKey - Gemini API key (server-side only).
 * @returns {Promise<object>} The raw Gemini JSON response (candidates...).
 */
export async function generateContent({ contents, generationConfig, model = GEMINI_MODEL, apiKey }) {
  const url = `${GEMINI_API_BASE_URL}/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({ contents, ...(generationConfig ? { generationConfig } : {}) }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const statusHint =
        response.status === 429 ? ' (Rate limited - too many requests)' :
        response.status === 503 ? ' (Service temporarily unavailable)' :
        '';
      throw new Error(`Gemini API error (${response.status})${statusHint}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Gemini API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Please try again.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
