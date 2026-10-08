import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { q, transaction, close } from '../backend/src/db.js';
try {
  const source = await fs.readFile(
    new URL('../database/005_bank_payments.sql', import.meta.url),
    'utf8',
  );
  await transaction(null, async (t) => {
    const receipts = await q(
      `
        SELECT
            id,
            orderId,
            amount,
            method,
            receivedBy,
            paidAt
        FROM
            dbo.ThanhToan
        ORDER BY
            id
      `,
      {},
      t,
    );
    const wallets = await q(
      `
        SELECT
            id,
            balance
        FROM
            dbo.KyThuatVien
        ORDER BY
            id
      `,
      {},
      t,
    );
    for (const batch of source.split(/^GO\s*$/m).filter((s) => s.trim())) await q(batch, {}, t);
    assert.deepEqual(
      await q(
        `
          SELECT
              id,
              orderId,
              amount,
              method,
              receivedBy,
              paidAt
          FROM
              dbo.ThanhToan
          ORDER BY
              id
        `,
        {},
        t,
      ),
      receipts,
      'Migration must preserve receipts',
    );
    assert.deepEqual(
      await q(
        `
          SELECT
              id,
              balance
          FROM
              dbo.KyThuatVien
          ORDER BY
              id
        `,
        {},
        t,
      ),
      wallets,
      'Migration must preserve wallet balances',
    );
  });
  console.log('Payment migration complete. Existing receipts and balances preserved.');
} finally {
  await close();
}
