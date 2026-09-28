import 'dotenv/config';
import { q } from '../backend/src/db.js';

async function main() {
  await q(`DELETE FROM dbo.DichVu WHERE groupCode IN ('SuaNha', 'Khac')`);
  console.log('Deleted SuaNha and Khac services.');
  process.exit(0);
}
main();
