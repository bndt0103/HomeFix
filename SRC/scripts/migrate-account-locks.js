import fs from 'node:fs/promises';
import { q, close } from '../backend/src/db.js';

try {
  const source = await fs.readFile(
    new URL('../database/007_temporary_account_locks.sql', import.meta.url),
    'utf8',
  );
  for (const batch of source.split(/^GO\s*$/m).filter((s) => s.trim())) await q(batch);
  console.log('Temporary account lock migration complete.');
} finally {
  await close();
}
