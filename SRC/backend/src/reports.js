import { Router } from 'express';
import { q, one, transaction } from './db.js';
import { z, ok, wrap, roles, fail, notify, checkVersion, versionSchema } from './common.js';
export const reportsRouter = Router();
function period(req) {
  const schema = z.iso.datetime({ offset: true }),
    from = req.query.from
      ? new Date(schema.parse(req.query.from))
      : new Date('2020-01-01T00:00:00Z'),
    to = req.query.to ? new Date(schema.parse(req.query.to)) : new Date(Date.now() + 86400000);
  if (from >= to) fail(422, 'INVALID_PERIOD', 'Ngày kết thúc phải sau ngày bắt đầu.');
  return { from, to };
}
reportsRouter.get(
  '/reports/quality',
  roles('GD', 'CSKH'),
  wrap(async (req, res) => {
    const p = period(req);
    const customers = await one(
      `
        SELECT
            (
                SELECT
                    COUNT(*)
                FROM
                    dbo.NguoiDung
                WHERE
                role = 'KH'
                AND createdAt >= @from
                AND createdAt < @to
            ) newCustomers,
            (
                SELECT
                    COUNT(DISTINCT customerId)
                FROM
                    dbo.ChiTietDonHang
                WHERE
                    createdAt >= @from
                    AND createdAt < @to
            ) activeCustomers,
            (
                SELECT
                    COUNT(*)
                FROM
                    dbo.ChiTietDonHang
                WHERE
                    createdAt >= @from
                    AND createdAt < @to
            ) totalOrders,
            (
                SELECT
                    COUNT(*)
                FROM
                    dbo.ThanhToan
                WHERE
                    paidAt >= @from
                    AND paidAt < @to
            ) completedOrders,
            (
                SELECT
                    COUNT(DISTINCT o.customerId)
                FROM
                    dbo.ThanhToan p
                    JOIN dbo.ChiTietDonHang o ON o.id = p.orderId
                WHERE
                    p.paidAt >= @from
                    AND p.paidAt < @to
            ) servedCustomers,
            (
                SELECT
                    COUNT(DISTINCT o.id)
                FROM
                    dbo.ChiTietDonHang o
                    JOIN dbo.YeuCauHoTro t ON t.orderId = o.id
                    AND t.type = 'Complaint'
                WHERE
                    o.createdAt >= @from
                    AND o.createdAt < @to
            ) complaintOrders
      `,
      p,
    );
    const ratings = await q(
      `
        SELECT
            rating,
            COUNT(*) count
        FROM
            dbo.DanhGia
        WHERE
            createdAt >= @from
            AND createdAt < @to
        GROUP BY
            rating
      `,
      p,
    );
    const lowRatings = await q(
      `
        SELECT
            TOP 100 r.orderId,
            r.rating,
            r.comment,
            r.createdAt,
            o.contactName,
            o.contactPhone,
            n.fullName technicianName
        FROM
            dbo.DanhGia r
            JOIN dbo.ChiTietDonHang o ON o.id = r.orderId
            LEFT JOIN dbo.NguoiDung n ON n.id = r.technicianId
        WHERE
            r.rating < 3
            AND r.createdAt >= @from
            AND r.createdAt < @to
        ORDER BY
            r.createdAt DESC
      `,
      p,
    );
    const complaints = await q(
      `
        SELECT
            TOP 100 t.id,
            t.orderId,
            t.description,
            t.status,
            t.createdAt,
            n.fullName customerName
        FROM
            dbo.YeuCauHoTro t
            JOIN dbo.NguoiDung n ON n.id = t.customerId
        WHERE
            t.type = 'Complaint'
            AND t.createdAt >= @from
            AND t.createdAt < @to
        ORDER BY
            t.id DESC
      `,
      p,
    );
    const total = ratings.reduce((sum, r) => sum + Number(r.count), 0),
      averageRating = total
        ? ratings.reduce((sum, r) => sum + Number(r.count) * r.rating, 0) / total
        : null;
    ok(res, {
      ...customers,
      averageRating,
      reviews: total,
      ratings,
      lowRatings,
      complaints,
      complaintRate: Number(customers.totalOrders)
        ? (100 * Number(customers.complaintOrders)) / Number(customers.totalOrders)
        : null,
    });
  }),
);
reportsRouter.get(
  '/reports/performance',
  roles('GD', 'KT', 'DPV', 'CSKH'),
  wrap(async (req, res) => {
    const rows = await q(
      `
        SELECT
            k.id,
            n.fullName,
            k.skillGroup,
            k.availability,
            n.isActive,
            n.createdAt,
            (
                SELECT
                    COUNT(DISTINCT a.orderId)
                FROM
                    dbo.LenhDieuPhoi a
                WHERE
                    a.technicianId = k.id
                    AND a.status = 'Accepted'
                    AND a.decidedAt >= @from
                    AND a.decidedAt < @to
            ) assignedOrders,
            (
                SELECT
                    COUNT(DISTINCT a.orderId)
                FROM
                    dbo.LenhDieuPhoi a
                    JOIN dbo.ChiTietDonHang o ON o.id = a.orderId
                WHERE
                    a.technicianId = k.id
                    AND a.status = 'Accepted'
                    AND a.decidedAt >= @from
                    AND a.decidedAt < @to
                    AND o.status = 'HoanThanh'
            ) finishedOrders,
            (
                SELECT
                    COUNT(DISTINCT a.orderId)
                FROM
                    dbo.LenhDieuPhoi a
                    JOIN dbo.YeuCauHoTro t ON t.orderId = a.orderId
                    AND t.type = 'Complaint'
                WHERE
                    a.technicianId = k.id
                    AND a.status = 'Accepted'
                    AND a.decidedAt >= @from
                    AND a.decidedAt < @to
            ) complaintOrders,
            (
                SELECT
                    COUNT(*)
                FROM
                    dbo.LenhDieuPhoi a
                WHERE
                    a.technicianId = k.id
                    AND a.status = 'Rejected'
                    AND a.decidedAt >= @from
                    AND a.decidedAt < @to
            ) rejectedOrders,
            (
                SELECT
                    AVG(CAST(rating AS decimal(5, 2)))
                FROM
                    dbo.DanhGia r
                WHERE
                    r.technicianId = k.id
                    AND r.createdAt >= @from
                    AND r.createdAt < @to
            ) averageRating
        FROM
            dbo.KyThuatVien k
            JOIN dbo.NguoiDung n ON n.id = k.id
      `,
      period(req),
    );
    const timings = await q(
      `
        WITH
            cohort AS (
                SELECT DISTINCT
                    a.technicianId,
                    a.orderId
                FROM
                    dbo.LenhDieuPhoi a
                WHERE
                    a.status = 'Accepted'
                    AND a.decidedAt >= @from
                    AND a.decidedAt < @to
            )
        SELECT
            c.technicianId,
            SUM(
                CASE
                    WHEN o.status = 'Huy' THEN 1
                    ELSE 0
                END
            ) cancelledOrders,
            SUM(
                CASE
                    WHEN w.hasWarranty = 1 THEN 1
                    ELSE 0
                END
            ) warrantyOrders,
            SUM(
                CASE
                    WHEN o.scheduledAt IS NOT NULL
                    AND h.arrivedAt IS NOT NULL THEN 1
                    ELSE 0
                END
            ) scheduledVisits,
            SUM(
                CASE
                    WHEN o.scheduledAt IS NOT NULL
                    AND h.arrivedAt <= o.scheduledAt THEN 1
                    ELSE 0
                END
            ) onTimeVisits,
            COUNT(
                CASE
                    WHEN h.finishedAt >= h.startedAt THEN 1
                END
            ) measuredJobs,
            SUM(
                CASE
                    WHEN h.finishedAt >= h.startedAt THEN DATEDIFF(second, h.startedAt, h.finishedAt) / 60.0
                    ELSE 0
                END
            ) processingMinutes
        FROM
            cohort c
            JOIN dbo.ChiTietDonHang o ON o.id = c.orderId
            OUTER APPLY (
                SELECT
                    MIN(
                        CASE
                            WHEN toStatus = 'DaDenNoi' THEN happenedAt
                        END
                    ) arrivedAt,
                    MIN(
                        CASE
                            WHEN toStatus = 'DangXuLy' THEN happenedAt
                        END
                    ) startedAt,
                    MIN(
                        CASE
                            WHEN toStatus = 'ChoNghiemThu' THEN happenedAt
                        END
                    ) finishedAt
                FROM
                    dbo.LichSuDonHang
                WHERE
                    orderId = c.orderId
                    AND actorId = c.technicianId
            ) h
            OUTER APPLY (
                SELECT
                    TOP 1 1 hasWarranty
                FROM
                    dbo.YeuCauHoTro
                WHERE
                    orderId = c.orderId
                    AND
                type = 'Warranty'
            ) w
        GROUP BY
            c.technicianId
      `,
      period(req),
    );
    ok(
      res,
      rows.map((r) => {
        const t = timings.find((t) => t.technicianId === r.id) || {},
          count = Number(r.assignedOrders);
        return {
          ...r,
          ...t,
          completionRate: count ? (100 * Number(r.finishedOrders)) / count : null,
          complaintRate: count ? (100 * Number(r.complaintOrders)) / count : null,
          cancellationRate: count ? (100 * Number(t.cancelledOrders || 0)) / count : null,
          warrantyRate: count ? (100 * Number(t.warrantyOrders || 0)) / count : null,
          onTimeRate: Number(t.scheduledVisits)
            ? (100 * Number(t.onTimeVisits)) / Number(t.scheduledVisits)
            : null,
          averageMinutes: Number(t.measuredJobs)
            ? Number(t.processingMinutes) / Number(t.measuredJobs)
            : null,
        };
      }),
    );
  }),
);
reportsRouter.get(
  '/reports/cashflow',
  roles('GD', 'KT'),
  wrap(async (req, res) => {
    const rows = await q(
      `
        WITH movements AS(
        SELECT paidAt happenedAt,  amount incoming,  CAST( 0 AS decimal( 18,  2)) outgoing
        FROM dbo.ThanhToan
        WHERE method = 'BANK' UNION ALL
        SELECT createdAt,  CASE WHEN type = 'Deposit' THEN amount
        ELSE 0
        END,  CASE WHEN type = 'Withdrawal' THEN - amount
        ELSE 0
        END
        FROM dbo.GiaoDichVi
        WHERE type IN( 'Deposit',  'Withdrawal'))
        SELECT CONVERT( varchar( 10),  DATEADD( hour,  7,  happenedAt),  23) day,
        SUM( incoming) incoming,
        SUM( outgoing) outgoing
        FROM movements
        WHERE happenedAt >= @from AND happenedAt < @to
        GROUP BY CONVERT( varchar( 10),  DATEADD( hour,  7,  happenedAt),  23)
        ORDER BY day
      `,
      period(req),
    );
    ok(res, rows);
  }),
);
const defaults = {
  qualityAlerts: false,
  weeklyReport: false,
  showComplaints: true,
  performanceAlerts: false,
  performanceWeekly: false,
  showTechnicians: true,
  financeAlerts: false,
  financeWeekly: false,
  showCashflow: true,
};
const preferenceSchema = z.strictObject({
  qualityAlerts: z.boolean(),
  weeklyReport: z.boolean(),
  showComplaints: z.boolean(),
  performanceAlerts: z.boolean().optional(),
  performanceWeekly: z.boolean().optional(),
  showTechnicians: z.boolean().optional(),
  financeAlerts: z.boolean().optional(),
  financeWeekly: z.boolean().optional(),
  showCashflow: z.boolean().optional(),
  expectedVersion: versionSchema.optional(),
});
reportsRouter.get(
  '/reports/monitoring',
  roles('GD', 'CSKH'),
  wrap(async (req, res) => {
    const row = await one(
      `
        SELECT
            value,
            version
        FROM
            dbo.CauHinh
        WHERE
            [key] = @key
      `,
      { key: 'report-monitor-' + req.user.id },
    );
    ok(res, { ...defaults, ...(row ? JSON.parse(row.value) : {}), version: row?.version ?? null });
  }),
);
reportsRouter.patch(
  '/reports/monitoring',
  roles('GD', 'CSKH'),
  wrap(async (req, res) => {
    const b = preferenceSchema.parse(req.body),
      key = 'report-monitor-' + req.user.id;
    ok(
      res,
      await transaction(req.user, async (t) => {
        const row = await one(
          `
            SELECT
                value,
                version
            FROM
                dbo.CauHinh
            WHERE
                [key] = @key
          `,
          { key },
          t,
        );
        if (row) checkVersion(row, b.expectedVersion);
        const { expectedVersion, ...changes } = b;
        if (
          req.user.role !== 'GD' &&
          [
            'performanceAlerts',
            'performanceWeekly',
            'showTechnicians',
            'financeAlerts',
            'financeWeekly',
            'showCashflow',
          ].some((key) => key in changes)
        )
          fail(403, 'FORBIDDEN', 'Chỉ giám đốc được chỉnh giám sát tài chính và hiệu suất.');
        const value = JSON.stringify({
          ...defaults,
          ...(row ? JSON.parse(row.value) : {}),
          ...changes,
        });
        if (row)
          await q(
            `
              UPDATE dbo.CauHinh
              SET
                  value = @value
              WHERE
                  [key] = @key
            `,
            { key, value },
            t,
          );
        else
          await q(
            `
              INSERT
                  dbo.CauHinh ([key], value, label)
              VALUES
                  (@key, @value, N'Cài đặt báo cáo cá nhân')
            `,
            { key, value },
            t,
          );
        const updated = await one(
          `
            SELECT
                version
            FROM
                dbo.CauHinh
            WHERE
                [key] = @key
          `,
          { key },
          t,
        );
        return { ...JSON.parse(value), version: updated.version };
      }),
    );
  }),
);
// Gửi thông báo giám sát trong ứng dụng.
export async function sendReportNotifications() {
  const configs = await q(`
    SELECT
        [key],
        value
    FROM
        dbo.CauHinh
    WHERE
        [key] LIKE 'report-monitor-%'
  `);
  if (!configs.length) return;
  const now = new Date(),
    local = new Date(now.getTime() + 7 * 3600000),
    day = local.getUTCDay(),
    monday = new Date(
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - ((day + 6) % 7)) -
        7 * 3600000,
    ),
    previous = new Date(monday.getTime() - 7 * 86400000);
  for (const row of configs) {
    let prefs;
    try {
      prefs = JSON.parse(row.value);
    } catch {
      continue;
    }
    const uid = Number(row.key.slice('report-monitor-'.length));
    if (!Number.isInteger(uid)) continue;
    if (
      !prefs.weeklyReport &&
      !prefs.qualityAlerts &&
      !prefs.performanceAlerts &&
      !prefs.performanceWeekly &&
      !prefs.financeAlerts &&
      !prefs.financeWeekly
    )
      continue;
    await transaction(null, async (t) => {
      const user = await one(
        `
          SELECT
              id,
          role
          FROM
              dbo.NguoiDung
          WHERE
              id = @id
              AND isActive = 1
              AND
          role IN ('GD', 'CSKH')
        `,
        { id: uid },
        t,
      );
      if (!user) return;
      if (prefs.weeklyReport) {
        const title =
          'Báo cáo chất lượng tuần ' +
          previous.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        if (
          !(await one(
            `
              SELECT
                  id
              FROM
                  dbo.ThongBao
              WHERE
                  userId = @uid
                  AND title = @title
                  AND createdAt >= @monday
            `,
            { uid, title, monday },
            t,
          ))
        ) {
          const stats = await one(
            `
              SELECT
                  COUNT(*) reviews,
                  AVG(CAST(rating AS decimal(5, 2))) averageRating
              FROM
                  dbo.DanhGia
              WHERE
                  createdAt >= @from
                  AND createdAt < @to
            `,
            { from: previous, to: monday },
            t,
          );
          await notify(
            t,
            uid,
            null,
            title,
            `${stats.reviews} đánh giá; điểm trung bình ${stats.averageRating == null ? 'chưa có' : Number(stats.averageRating).toFixed(2) + '/5'}. Mở Báo cáo để xem chi tiết.`,
          );
        }
      }
      if (user.role === 'GD') {
        const emit = async (title, body) => {
          if (
            !(await one(
              `
                SELECT
                    id
                FROM
                    dbo.ThongBao
                WHERE
                    userId = @uid
                    AND title = @title
                    AND createdAt >= @monday
              `,
              { uid, title, monday },
              t,
            ))
          )
            await notify(t, uid, null, title, body);
        };
        if (prefs.financeWeekly || prefs.financeAlerts) {
          const cash = await one(
            `
              SELECT
                  (
                      SELECT
                          COALESCE(SUM(amount), 0)
                      FROM
                          dbo.ThanhToan
                      WHERE
                          method = 'BANK'
                          AND paidAt >= @from
                          AND paidAt < @to
                  ) + (
                      SELECT
                          COALESCE(SUM(amount), 0)
                      FROM
                          dbo.GiaoDichVi
                      WHERE
                      type IN ('Deposit', 'Withdrawal')
                      AND createdAt >= @from
                      AND createdAt < @to
                  ) netFlow
            `,
            { from: previous, to: monday },
            t,
          );
          if (prefs.financeWeekly)
            await emit(
              'Báo cáo tài chính tuần ' +
                previous.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
              `Dòng tiền thuần đã ghi nhận tuần trước: ${Number(cash.netFlow).toLocaleString('vi-VN')} đ. Mở Báo cáo tài chính để xem phạm vi và chi tiết.`,
            );
          if (prefs.financeAlerts && Number(cash.netFlow) < 0)
            await emit(
              'Cảnh báo dòng tiền thấp',
              'Tổng tiền ra vượt tiền vào trong tuần trước. Mở Báo cáo tài chính để kiểm tra.',
            );
        }
        if (prefs.performanceWeekly || prefs.performanceAlerts) {
          const perf = await one(
            `
              SELECT
                  COUNT(*) assignedOrders,
                  COALESCE(
                      SUM(
                          CASE
                              WHEN o.status = 'HoanThanh' THEN 1
                              ELSE 0
                          END
                      ),
                      0
                  ) finishedOrders
              FROM
                  dbo.LenhDieuPhoi a
                  JOIN dbo.ChiTietDonHang o ON o.id = a.orderId
              WHERE
                  a.status = 'Accepted'
                  AND a.decidedAt >= @from
                  AND a.decidedAt < @to
            `,
            { from: previous, to: monday },
            t,
          );
          if (prefs.performanceWeekly)
            await emit(
              'Báo cáo hiệu suất tuần ' +
                previous.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
              `${perf.finishedOrders}/${perf.assignedOrders} đơn đã nhận tuần trước hiện đã hoàn thành. Mở Hiệu suất KTV để xem chi tiết.`,
            );
          if (
            prefs.performanceAlerts &&
            Number(perf.assignedOrders) > 0 &&
            Number(perf.finishedOrders) / Number(perf.assignedOrders) < 0.9
          )
            await emit(
              'Cảnh báo hiệu suất thấp',
              'Dưới 90% đơn nhận tuần trước đã hoàn thành; số liệu gồm cả đơn đang làm. Mở Hiệu suất KTV để kiểm tra.',
            );
        }
      }

      if (prefs.qualityAlerts) {
        const stats = await one(
          `
            SELECT
                (
                    SELECT
                        AVG(CAST(rating AS decimal(5, 2)))
                    FROM
                        dbo.DanhGia
                    WHERE
                        createdAt >= @from
                ) averageRating,
                (
                    SELECT
                        COUNT(*)
                    FROM
                        dbo.ChiTietDonHang
                    WHERE
                        createdAt >= @from
                ) totalOrders,
                (
                    SELECT
                        COUNT(DISTINCT o.id)
                    FROM
                        dbo.ChiTietDonHang o
                        JOIN dbo.YeuCauHoTro t ON t.orderId = o.id
                        AND t.type = 'Complaint'
                    WHERE
                        o.createdAt >= @from
                ) complaints
          `,
          { from: previous },
          t,
        );
        const badRating = stats.averageRating != null && Number(stats.averageRating) < 4.2,
          badRate =
            Number(stats.totalOrders) > 0 &&
            Number(stats.complaints) / Number(stats.totalOrders) > 0.03;
        if (
          (badRating || badRate) &&
          !(await one(
            `
              SELECT
                  id
              FROM
                  dbo.ThongBao
              WHERE
                  userId = @uid
                  AND title = N'Cảnh báo chất lượng dịch vụ'
                  AND createdAt >= @monday
            `,
            { uid, monday },
            t,
          ))
        )
          await notify(
            t,
            uid,
            null,
            'Cảnh báo chất lượng dịch vụ',
            'Điểm đánh giá dưới 4,2 sao hoặc tỷ lệ đơn có khiếu nại trên 3%. Mở Báo cáo để kiểm tra các đơn cần chăm sóc.',
          );
      }
    });
  }
}
