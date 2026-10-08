import fs from 'node:fs';
import {q,one,close} from '../backend/src/db.js';
try {
    if (!(await one("Select OBJECT_ID('dbo.ChiTietDonHang','U') id")).id) throw new Error('Cần nâng cấp cơ sở dữ liệu đơn nhiều dịch vụ trước.');
    const source=fs.readFileSync(new URL('../database/014_support_chat.sql',import.meta.url),'utf8');
    for(const batch of source.split(/^Go\s*$/mi).filter(s=>s.trim())) await q(batch);
    console.log('Đã cập nhật chat hỗ trợ và liên kết thông báo.');
} finally {await close();}
