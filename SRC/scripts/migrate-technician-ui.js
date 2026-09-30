import fs from 'node:fs/promises';
import { q, transaction, close } from '../backend/src/db.js';
try {
 const source = await fs.readFile(new URL('../database/008_technician_application.sql',import.meta.url),'utf8');
 await transaction(null,async t => { for (const batch of source.split(/^GO\s*$/m).filter(s => s.trim())) await q(batch,{},t); });
 console.log('Technician application migration complete (existing data preserved).');
} finally { await close(); }
