import { z } from 'zod';
import crypto from 'node:crypto';
import { q, one, sql, dto } from './db.js';
export { z };
export function fail(status, code, message) {
  const e = new Error(message || code);
  e.status = status;
  e.code = code;
  throw e;
}
export const ok = (res, data, status = 200, meta = {}) =>
  res
    .status(status)
    .json({ data: dto(data), meta: { serverTime: new Date().toISOString(), ...meta } });
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
export const roles =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        Object.assign(new Error('Bạn không có quyền thực hiện thao tác này.'), {
          status: 403,
          code: 'FORBIDDEN',
        }),
      );
    next();
  };
export const str = (min = 1, max = 1000) => z.string().trim().min(min).max(max);
export const idSchema = z.coerce.number().int().positive();
export function id(value) {
  return idSchema.parse(value);
}
export const versionSchema = z
  .string()
  .regex(/^[A-Za-z0-9+/]{11}=$/, 'Phiên bản không hợp lệ.')
  .refine((s) => Buffer.from(s, 'base64').length === 8);
export const money = z
  .string()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, 'Nhập số tiền không có dấu phân cách.')
  .refine((s) => Number(s) <= 100000000, 'Số tiền quá lớn.');
export const decisionSchema = z
  .strictObject({
    decision: z.enum(['Approved', 'Rejected']),
    reason: str(1, 1000).optional(),
    signatureId: idSchema.nullable().optional(),
    expectedVersion: versionSchema,
  })
  .superRefine((d, c) => {
    if (d.decision === 'Rejected' && !d.reason)
      c.addIssue({ code: 'custom', path: ['reason'], message: 'Vui lòng nêu lý do từ chối.' });
  });
export function checkVersion(row, expected) {
  if (!row) fail(404, 'NOT_FOUND', 'Không tìm thấy dữ liệu.');
  if (!row.version || row.version.toString('base64') !== expected)
    fail(409, 'VERSION_CONFLICT', 'Dữ liệu vừa thay đổi. Hãy tải lại trước khi thao tác.');
}
export function state(row, ...allowed) {
  if (!allowed.includes(row.status))
    fail(409, 'INVALID_STATE', 'Thao tác không phù hợp trạng thái hiện tại.');
}
export async function audit(t, user, action, entity, entityId, detail = '') {
  await q(
    `
      INSERT
          dbo.NhatKy (actorId, action, entity, entityId, detail)
      VALUES
          (@actorId, @action, @entity, @entityId, @detail)
    `,
    { actorId: user?.id, action, entity, entityId, detail },
    t,
  );
}
export async function notifyRole(t, role, orderId, title, body = '') {
  const users = await q(
    `
      Select
          id
      From
          dbo.NguoiDung
      Where
      role = @role
      And isActive = 1
    `,
    { role },
    t,
  );
  for (const user of users) await notify(t, user.id, orderId, title, body);
}
export async function notify(t, userId, orderId, title, body = '') {
  await q(
    `
      INSERT
          dbo.ThongBao (userId, orderId, title, body)
      VALUES
          (@userId, @orderId, @title, @body)
    `,
    { userId, orderId, title, body },
    t,
  );
}
export async function transition(t, order, user, next, reason, expected) {
  const r = new sql.Request(t);
  r.input('OrderId', sql.Int, order.id)
    .input('ActorId', sql.Int, user?.id ?? null)
    .input('ExpectedVersion', sql.Binary(8), expected ? Buffer.from(expected, 'base64') : null)
    .input('NextStatus', sql.VarChar(30), next)
    .input('Reason', sql.NVarChar(1000), reason);
  await r.execute('dbo.sp_ChuyenTrangThaiDon');
}
export async function touch(t, orderId) {
  await q(
    `
      UPDATE dbo.ChiTietDonHang
      SET
          updatedAt = SYSUTCDATETIME()
      WHERE
          id = @id
    `,
    { id: orderId },
    t,
  );
}
export async function getOrder(orderId, user, t) {
  const o = await one(
    `
      SELECT
          d.*,
          CASE
              WHEN p.id IS NULL THEN 'Unpaid'
              ELSE 'Paid'
          END paymentStatus,
          n.fullName technicianName
      FROM
          dbo.ChiTietDonHang d
          LEFT JOIN dbo.ThanhToan p ON p.orderId = d.id
          LEFT JOIN dbo.NguoiDung n ON n.id = d.assignedTechnicianId
      WHERE
          d.id = @id
    `,
    { id: orderId },
    t,
  );
  if (!o) fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
  if (user.role === 'KH' && o.customerId !== user.id) fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
  if (
    user.role === 'KTV' &&
    !(await one(
      `
        SELECT
            TOP 1 id
        FROM
            dbo.LenhDieuPhoi
        WHERE
            orderId = @id
            AND technicianId = @uid
            AND (
                isActive = 1
                OR status = 'Accepted'
            )
      `,
      { id: orderId, uid: user.id },
      t,
    ))
  )
    fail(404, 'NOT_FOUND', 'Không tìm thấy đơn.');
  if (!['KH', 'KTV', 'DPV', 'CSKH', 'KT'].includes(user.role))
    fail(403, 'FORBIDDEN', 'Vai trò này không xem chi tiết đơn.');
  return o;
}
export async function activeTech(t, order, user) {
  if (user.role !== 'KTV') fail(403, 'FORBIDDEN', 'Chỉ kỹ thuật viên được thực hiện.');
  if (
    !(await one(
      `
        SELECT
            id
        FROM
            dbo.LenhDieuPhoi
        WHERE
            orderId = @id
            AND technicianId = @uid
            AND status = 'Accepted'
            AND isActive = 1
      `,
      { id: order.id, uid: user.id },
      t,
    ))
  )
    fail(404, 'NOT_FOUND', 'Bạn không phụ trách ca này.');
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical(value[k])]),
    );
  return value;
}
export async function idempotent(t, req, body, fn) {
  const key = z.string().uuid().parse(req.get('Idempotency-Key'));
  const route = `${req.method} ${req.path}`;
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(canonical(body)))
    .digest('hex');
  const params = { actorId: req.user.id, route, key, hash };
  const old = await one(
    `
      SELECT
          payloadHash,
          resultJson
      FROM
          dbo.Idempotency
      WHERE
          actorId = @actorId
          AND
      route = @route
      AND requestKey = @key
    `,
    params,
    t,
  );
  if (old) {
    if (old.payloadHash !== hash)
      fail(409, 'IDEMPOTENCY_KEY_REUSED', 'Mã yêu cầu đã được dùng với dữ liệu khác.');
    return { data: JSON.parse(old.resultJson), replay: true };
  }
  const data = await fn();
  await q(
    `
      INSERT
          dbo.Idempotency (
              actorId,
              route,
              requestKey,
              payloadHash,
              resultJson
          )
      VALUES
          (@actorId, @route, @key, @hash, @json)
    `,
    { ...params, json: JSON.stringify(dto(data)) },
    t,
  );
  return { data, replay: false };
}
export function page(req) {
  return z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    })
    .parse(req.query);
}
