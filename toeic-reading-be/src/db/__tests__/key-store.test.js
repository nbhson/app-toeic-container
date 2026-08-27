import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createKeyStore } from '../key-store.js';

describe('key-store', () => {
  let tempDir;
  let store;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'key-store-test-'));
    store = createKeyStore(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getKey', () => {
    it('returns null for a non-existent key', () => {
      expect(store.getKey('omniroute')).toBeNull();
    });

    it('returns the stored key after setKey', () => {
      store.setKey('omniroute', 'test-api-key-123');
      expect(store.getKey('omniroute')).toBe('test-api-key-123');
    });
  });

  describe('setKey', () => {
    it('stores a key value', () => {
      store.setKey('omniroute', 'my-secret-key');
      expect(store.getKey('omniroute')).toBe('my-secret-key');
    });

    it('trims whitespace from value', () => {
      store.setKey('omniroute', '  padded-key  ');
      expect(store.getKey('omniroute')).toBe('padded-key');
    });

    it('removes key when value is empty string', () => {
      store.setKey('omniroute', 'key-to-delete');
      expect(store.getKey('omniroute')).toBe('key-to-delete');

      store.setKey('omniroute', '');
      expect(store.getKey('omniroute')).toBeNull();
    });

    it('removes key when value is null', () => {
      store.setKey('omniroute', 'some-key');
      store.setKey('omniroute', null);
      expect(store.getKey('omniroute')).toBeNull();
    });

    it('removes key when value is whitespace only', () => {
      store.setKey('omniroute', 'some-key');
      store.setKey('omniroute', '   ');
      expect(store.getKey('omniroute')).toBeNull();
    });

    it('creates data directory if it does not exist', () => {
      const newDir = join(tempDir, 'nested', 'data');
      const newStore = createKeyStore(newDir);
      newStore.setKey('test', 'value');
      expect(newStore.getKey('test')).toBe('value');
    });

    it('persists multiple keys independently', () => {
      store.setKey('omniroute', 'key-a');
      store.setKey('gemini', 'key-b');
      expect(store.getKey('omniroute')).toBe('key-a');
      expect(store.getKey('gemini')).toBe('key-b');
    });
  });

  describe('listKeys', () => {
    it('returns empty object when no keys are stored', () => {
      expect(store.listKeys()).toEqual({});
    });

    it('returns masked key info for stored keys', () => {
      store.setKey('omniroute', 'sk-1234567890abcdef');
      const result = store.listKeys();
      expect(result.omniroute).toEqual({
        hasValue: true,
        masked: 'sk-1***************',
      });
    });

    it('masks short keys correctly', () => {
      store.setKey('test', 'abc');
      const result = store.listKeys();
      expect(result.test).toEqual({
        hasValue: true,
        masked: 'abc',
      });
    });
  });

  describe('persistence', () => {
    it('creates keys.json file on disk', () => {
      store.setKey('omniroute', 'persist-test');
      const filePath = join(tempDir, 'keys.json');
      expect(existsSync(filePath)).toBe(true);

      const content = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(content.omniroute).toBe('persist-test');
    });

    it('can be read by a new store instance', () => {
      store.setKey('omniroute', 'shared-key');
      const store2 = createKeyStore(tempDir);
      expect(store2.getKey('omniroute')).toBe('shared-key');
    });
  });
});