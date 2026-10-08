import fs from 'node:fs/promises';
import { q, one } from '../backend/src/db.js';
import { serviceCatalog } from '../database/service-catalog.js';
export async function applyServiceCatalog(t) {
  const hadColumn =
    (
      await one(
        `
          SELECT
              COL_LENGTH('dbo.DichVu', 'isPopular') AS length
        `,
        {},
        t,
      )
    ).length !== null;
  const source = await fs.readFile(
    new URL('../database/006_service_catalog.sql', import.meta.url),
    'utf8',
  );
  await q(source, {}, t);
  if (
    await one(
      `
        SELECT
            version
        FROM
            dbo.SchemaVersion
        WHERE
            version = 6
      `,
      {},
      t,
    )
  )
    return { alreadyApplied: true, inserted: 0 };
  let inserted = 0;
  for (const [name, groupCode, description, inspectionFee, laborFee, isPopular] of serviceCatalog) {
    const existing = await one(
      `
        SELECT
            id
        FROM
            dbo.DichVu
        WHERE
            name = @name
      `,
      { name },
      t,
    );
    if (existing) {
      if (!hadColumn)
        await q(
          `
            UPDATE dbo.DichVu
            SET
                isPopular = @popular
            WHERE
                id = @id
          `,
          { id: existing.id, popular: !!isPopular },
          t,
        );
    } else {
      await q(
        `
          INSERT
              dbo.DichVu (
                  name,
                  groupCode,
                  description,
                  inspectionFee,
                  laborFee,
                  commissionRatePercent,
                  isPopular
              )
          VALUES
              (
                  @name,
                  @groupCode,
                  @description,
                  @inspectionFee,
                  @laborFee,
                  15,
                  @isPopular
              )
        `,
        { name, groupCode, description, inspectionFee, laborFee, isPopular: !!isPopular },
        t,
      );
      inserted++;
    }
  }
  await q(
    `
      INSERT
          dbo.SchemaVersion (version)
      VALUES
          (6)
    `,
    {},
    t,
  );
  return { alreadyApplied: false, inserted };
}
