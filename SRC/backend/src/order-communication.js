import { Router } from 'express';
import { q, one, transaction } from './db.js';
import { z, str, id, ok, wrap, fail, roles, versionSchema, checkVersion, state, getOrder, notify, page } from './common.js';

export const communicationRouter = Router();
const customerChatTitle = 'Khách hàng nhắn tin';
const dispatcherChatTitle = 'Điều phối viên trả lời';
communicationRouter.get('/dispatch/conversations', roles('DPV'), wrap(async (req, res) => {
    const p = page(req), params = { uid: req.user.id, title: customerChatTitle, offset: (p.page - 1) * p.pageSize, limit: p.pageSize };
    const total = await one('Select Count(*) n From dbo.ChiTietDonHang d Where Exists(Select 1 From dbo.TinNhanDonHang m Where m.orderId=d.id)');
    const rows = await q(`Select d.id,d.MaDonHang,d.serviceName,d.contactName,d.status,
        latest.text lastMessage,latest.createdAt lastMessageAt,
        (Select Count(*) From dbo.ThongBao n Where n.orderId=d.id And n.userId=@uid And n.title=@title And n.readAt Is Null) unreadCount
        From dbo.ChiTietDonHang d Cross Apply (Select Top 1 m.text,m.createdAt,m.id From dbo.TinNhanDonHang m Where m.orderId=d.id Order By m.id Desc) latest
        Order By unreadCount Desc,latest.id Desc Offset @offset Rows Fetch Next @limit Rows Only`, params);
    ok(res, rows, 200, { ...p, total: total.n });
}));
communicationRouter.post('/orders/:id/chat/read', roles('KH', 'DPV'), wrap(async (req, res) => {
    const body = z.strictObject({ throughId: z.number().int().positive() }).parse(req.body);
    await transaction(req.user, async t => {
        const order = await getOrder(id(req.params.id), req.user, t);
        if (!await one('Select id From dbo.TinNhanDonHang Where orderId=@oid And id=@mid', { oid: order.id, mid: body.throughId }, t)) fail(404, 'NOT_FOUND', 'Không tìm thấy tin nhắn.');
        // A message arriving after the displayed batch must remain unread.
        await q(`Update dbo.ThongBao Set readAt=SysUtcDateTime()
            Where userId=@uid And orderId=@oid And title=@title And readAt Is Null
            And Not Exists(Select 1 From dbo.TinNhanDonHang m Join dbo.NguoiDung n On n.id=m.authorId
                Where m.orderId=@oid And m.id>@mid And n.role=@senderRole)`,
            { uid: req.user.id, oid: order.id, mid: body.throughId, title: req.user.role === 'DPV' ? customerChatTitle : dispatcherChatTitle, senderRole: req.user.role === 'DPV' ? 'KH' : 'DPV' }, t);
    });
    ok(res, { read: true });
}));
communicationRouter.get('/orders/:id/chat', roles('KH', 'DPV'), wrap(async (req, res) => {
    const order = await getOrder(id(req.params.id), req.user);
    ok(res, await q(`Select m.*, n.fullName authorName, n.role authorRole
        From dbo.TinNhanDonHang m Join dbo.NguoiDung n On n.id=m.authorId
        Where m.orderId=@id Order By m.id`, { id: order.id }));
}));
communicationRouter.post('/orders/:id/chat', roles('KH', 'DPV'), wrap(async (req, res) => {
    const body = z.strictObject({ text: str(1, 2000) }).parse(req.body);
    const message = await transaction(req.user, async t => {
        const order = await getOrder(id(req.params.id), req.user, t);
        const message = await one(`Insert Into dbo.TinNhanDonHang(orderId,authorId,text)
            Output Inserted.* Values(@oid,@uid,@text)`, { oid: order.id, uid: req.user.id, text: body.text }, t);
        const recipients = req.user.role === 'KH' ? await q("Select id From dbo.NguoiDung Where role='DPV' And isActive=1", {}, t) : [{ id: order.customerId }];
        for (const recipient of recipients) await notify(t, recipient.id, order.id, req.user.role === 'KH' ? customerChatTitle : dispatcherChatTitle, body.text.slice(0, 1000));
        return message;
    });
    ok(res, message, 201);
}));
communicationRouter.post('/orders/:id/cancel-request', roles('KH'), wrap(async (req, res) => {
    const body = z.strictObject({ reason: str(5, 1000), expectedVersion: versionSchema }).parse(req.body);
    const order = await transaction(req.user, async t => {
        const current = await getOrder(id(req.params.id), req.user, t);
        checkVersion(current, body.expectedVersion);
        state(current, 'ChoTiepNhan', 'ChoDuyetSoBo', 'ChoPhanCong', 'ChoNhan', 'DaTiepNhan', 'DangDiChuyen');
        if (current.cancelRequestedAt) fail(409, 'CANCELLATION_REQUEST_EXISTS', 'Yêu cầu hủy đang chờ điều phối xử lý.');
        await q(`Update dbo.ChiTietDonHang Set cancelRequestedBy='Customer',cancelRequestedAt=SysUtcDateTime(),
            cancelReason=@reason Where id=@id`, { id: current.id, reason: body.reason }, t);
        for (const dispatcher of await q("Select id From dbo.NguoiDung Where role='DPV' And isActive=1", {}, t)) {
            await notify(t, dispatcher.id, current.id, 'Khách hàng yêu cầu hủy đơn', body.reason);
        }
        return one('Select * From dbo.ChiTietDonHang Where id=@id', { id: current.id }, t);
    });
    ok(res, order, 201);
}));
