import fs from 'node:fs/promises';
import {q,close} from '../backend/src/db.js';
try {
 const source=await fs.readFile(new URL('../database/007_user_avatar.sql',import.meta.url),'utf8');
 for(const batch of source.split(/^GO\s*$/m).filter(s=>s.trim()))await q(batch);
 console.log('Avatar migration complete.');
} finally {await close();}
