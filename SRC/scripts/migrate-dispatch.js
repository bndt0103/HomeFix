import fs from 'node:fs/promises';
import { q, transaction, close } from '../backend/src/db.js';
try {
    const source = await fs.readFile(new URL('../database/010_dispatch_communication.sql', import.meta.url), 'utf8');
    await transaction(null, async t => {
        for (const batch of source.split(/^GO\s*$/mi).filter(s => s.trim())) await q(batch, {}, t);
    });
    console.log('Dispatch communication migration complete.');
} finally { await close(); }
