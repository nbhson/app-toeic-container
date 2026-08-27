/**
 * Simple JSON file-based key store for API keys.
 * Stores keys in data/keys.json (gitignored).
 * No native dependencies required.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_DATA_DIR = join(__dirname, '../../data');
const KEYS_FILENAME = 'keys.json';

/**
 * Creates a key store instance with the given data directory.
 * @param {string} dataDir - Directory to store keys.json
 * @returns {{ getKey: Function, setKey: Function, listKeys: Function }}
 */
export function createKeyStore(dataDir = DEFAULT_DATA_DIR) {
  const keysFile = join(dataDir, KEYS_FILENAME);

  function ensureDataDir() {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    if (!existsSync(keysFile)) {
      writeFileSync(keysFile, JSON.stringify({}, null, 2), 'utf-8');
    }
  }

  function readKeys() {
    ensureDataDir();
    try {
      const raw = readFileSync(keysFile, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  function writeKeys(keys) {
    ensureDataDir();
    writeFileSync(keysFile, JSON.stringify(keys, null, 2), 'utf-8');
  }

  /**
   * Gets a stored API key by name.
   * @param {string} keyName - e.g. 'omniroute'
   * @returns {string|null} The stored key or null if not found.
   */
  function getKey(keyName) {
    const keys = readKeys();
    return keys[keyName] || null;
  }

  /**
   * Stores an API key. If value is empty/null, the key is removed.
   * @param {string} keyName - e.g. 'omniroute'
   * @param {string} value - The API key value
   */
  function setKey(keyName, value) {
    const keys = readKeys();
    if (!value || !value.trim()) {
      delete keys[keyName];
    } else {
      keys[keyName] = value.trim();
    }
    writeKeys(keys);
  }

  /**
   * Gets all stored keys (without exposing full values, masked for security).
   * @returns {object} An object with key names and whether they are set.
   */
  function listKeys() {
    const keys = readKeys();
    const result = {};
    for (const [name, value] of Object.entries(keys)) {
      result[name] = {
        hasValue: !!value,
        masked: value ? `${value.substring(0, 4)}${'*'.repeat(Math.max(0, value.length - 4))}` : '',
      };
    }
    return result;
  }

  return { getKey, setKey, listKeys };
}

/**
 * Default key store instance using the production data directory.
 */
export const keyStore = createKeyStore();

// Re-export for backward compatibility
export const getKey = keyStore.getKey;
export const setKey = keyStore.setKey;
export const listKeys = keyStore.listKeys;