import fs from 'node:fs/promises';
import { q, transaction, close } from '../backend/src/db.js';
try {
  const source = await fs.readFile(
    new URL('../database/011_material_onsite_consent.sql', import.meta.url),
    'utf8',
  );
  await transaction(null, async (t) => {
    for (const batch of source.split(/^GO\s*$/im).filter((s) => s.trim())) await q(batch, {}, t);
  });
  console.log('Onsite material consent migration complete; existing records preserved.');
} finally {
  await close();
}
