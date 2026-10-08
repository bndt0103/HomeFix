import { Router } from 'express';
import { q, one, transaction } from './db.js';
import { z, str, id, ok, wrap, fail, roles, idempotent, page } from './common.js';
import { createOrderHeader, createOrderItem } from './orders.js';

export const serviceOrdersRouter = Router();
const itemSchema = z.strictObject({
    serviceId: z.number().int().positive(),
    description: str(5, 2000).optional(),
    attachmentIds: z.array(z.number().int().positive()).max(5).default([])
});
const schedule = z.iso.datetime({ offset: true }).nullable().default(null);
const bookingSchema = z.strictObject({
    address: str(10, 500), description: str(5, 2000), scheduledAt: schedule,
    items: z.array(itemSchema).min(1).max(10)
});
async function header(oid, user, t) {
    const result = await one('Select * From dbo.DonHang Where MaDonHang=@id And MaKhachHang=@uid', { id: oid, uid: user.id }, t);
    if (!result) fail(404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.');
    return result;
}
async function decorate(order, t) {
    const items = await q(`Select c.*,n.fullName technicianName,
        Case When p.id Is Null Then 'Unpaid' Else 'Paid' End paymentStatus,
        a.total acceptanceTotal,b.total quotedTotal,p.amount paidAmount
        From dbo.ChiTietDonHang c
        Left Join dbo.NguoiDung n On n.id=c.assignedTechnicianId
        Left Join dbo.ThanhToan p On p.orderId=c.id
        Left Join dbo.PhieuNghiemThu a On a.orderId=c.id And a.status='Approved'
        Left Join dbo.BaoGiaSoBo b On b.orderId=c.id
        Where c.MaDonHang=@id Order By c.id`, { id: order.MaDonHang }, t);
    const completed = items.filter(i => i.status === 'HoanThanh').length;
    const cancelled = items.filter(i => i.status === 'Huy').length;
    const sumMoney = field => {
        const cents = items.reduce((sum, item) => {
            const [whole, fraction = ''] = String(item[field] || '0').split('.');
            return sum + BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
        }, 0n);
        return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
    };
    return { ...order, items, completed, cancelled, itemCount: items.length,
        status: cancelled === items.length ? 'Huy' : completed + cancelled === items.length ? 'HoanThanh' : items.every(item => item.status === 'ChoTiepNhan') ? 'ChoTiepNhan' : 'DangXuLy',
        acceptedTotal: sumMoney('acceptanceTotal'),
        paidTotal: sumMoney('paidAmount')
    };
}
serviceOrdersRouter.get('/service-orders', roles('KH'), wrap(async (req, res) => {
    const p = page(req);
    const total = await one('Select Count(*) n From dbo.DonHang Where MaKhachHang=@uid', { uid: req.user.id });
    const rows = await q(`Select * From dbo.DonHang Where MaKhachHang=@uid
        Order By MaDonHang Desc Offset @offset Rows Fetch Next @limit Rows Only`,
        { uid: req.user.id, offset: (p.page - 1) * p.pageSize, limit: p.pageSize });
    ok(res, await Promise.all(rows.map(row => decorate(row))), 200, { ...p, total: total.n });
}));
serviceOrdersRouter.get('/service-orders/:id', roles('KH'), wrap(async (req, res) => {
    ok(res, await decorate(await header(id(req.params.id), req.user)));
}));
serviceOrdersRouter.post('/service-orders', roles('KH'), wrap(async (req, res) => {
    const body = bookingSchema.parse(req.body);
    const result = await transaction(req.user, t => idempotent(t, req, body, async () => {
        const order = await createOrderHeader(t, req.user, body);
        for (const item of body.items) await createOrderItem(t, req.user, {
            ...body, ...item, description: item.description || body.description
        }, order.MaDonHang);
        return decorate(order, t);
    }));
    ok(res, result.data, result.replay ? 200 : 201);
}));
serviceOrdersRouter.post('/service-orders/:id/items', roles('KH'), wrap(async (req, res) => {
    const body = z.strictObject({ items: z.array(itemSchema).min(1).max(10), scheduledAt: schedule }).parse(req.body);
    const result = await transaction(req.user, t => idempotent(t, req, body, async () => {
        const order = await header(id(req.params.id), req.user, t);
        const existing = await one('Select Count(*) n From dbo.ChiTietDonHang Where MaDonHang=@id', { id: order.MaDonHang }, t);
        if (existing.n + body.items.length > 100) fail(422, 'TOO_MANY_ITEMS', 'Đơn tối đa 100 công việc; vui lòng đặt đơn mới.');
        for (const item of body.items) await createOrderItem(t, req.user, {
            ...item, address: order.DiaChi, description: item.description || order.MoTa, scheduledAt: body.scheduledAt
        }, order.MaDonHang);
        return decorate(order, t);
    }));
    ok(res, result.data, result.replay ? 200 : 201);
}));
