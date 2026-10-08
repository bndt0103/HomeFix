import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { one, q, close } from '../backend/src/db.js';
try {
    const schema = await one("Select Object_Id('dbo.ChiTietDonHang','U') id");
    if (!schema.id) throw new Error('Database cũ: chuyển sang database mới bằng db:upgrade:orders trước.');
    for (const filename of ['012_order_item_integrity.sql', '013_vietnamese_dictionary.sql']) {
        const text = await fs.readFile(fileURLToPath(new URL('../database/' + filename, import.meta.url)), 'utf8');
        for (const batch of text.split(/^GO\s*$/mi).filter(text => text.trim())) await q(batch);
    }
    console.log('Order item integrity and Vietnamese descriptions ready.');
} finally { await close(); }
