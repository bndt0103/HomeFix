import fs from 'node:fs/promises';
import { q, close } from '../backend/src/db.js';
try {
  const source = await fs.readFile(
    new URL('../database/004_auth_otp.sql', import.meta.url),
    'utf8',
  );
  for (const batch of source.split(/^GO\s*$/m).filter((s) => s.trim())) await q(batch);
  console.log('OTP migration complete. Existing accounts are unchanged.');
} finally {
  await close();
}
