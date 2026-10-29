/**
 * Atomic JSON file write: serialize to a temp file in the same directory,
 * then rename over the target. A crash mid-write can never leave a
 * truncated/corrupt store file behind (rename is atomic on POSIX).
 */

import { writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * Writes `data` as pretty-printed JSON to `filePath` atomically.
 * @param {string} filePath - final destination path
 * @param {unknown} data - JSON-serializable value
 */
export function writeJsonFileAtomic(filePath, data) {
  const dir = dirname(filePath);
  const tmp = join(dir, `.${`${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`}.tmp`);
  try {
    writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    renameSync(tmp, filePath);
  } catch (err) {
    // Best-effort cleanup of the orphan temp file; the original stays intact.
    try {
      unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    throw err;
  }
}
