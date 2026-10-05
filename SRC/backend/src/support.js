import { Router } from 'express';
import { q, one, transaction } from './db.js';
import {
  z, str, id, ok, wrap, fail, roles, versionSchema, checkVersion,
  state, getOrder, touch, notify, audit, page
} from './common.js';

export const supportRouter = Router();

/* ============================================================
   1. ĐÁNH GIÁ (REVIEWS) TỪ KHÁCH HÀNG
   ============================================================ */

// Xem đánh giá của một đơn hàng
supportRouter.get('/orders/:id/reviews', wrap(async (req, res) => {
  const oid = id(req.params.id);
  await getOrder(oid, req.user);
  ok(res, await q('SELECT * FROM dbo.DanhGia WHERE orderId=@id', { id: oid }));
}));

// Khách hàng gửi đánh giá sau khi hoàn thành đơn
supportRouter.post('/orders/:id/reviews', roles('KH'), wrap(async (req, res) => {
  const oid = id(req.params.id);
  const b = z.strictObject({
    rating: z.number().int().min(1).max(5),
    comment: str(0, 1500)
  }).parse(req.body);

  const review = await transaction(req.user, async t => {
    const o = await getOrder(oid, req.user, t);
    state(o, 'HoanThanh');
    const p = await one('SELECT p.*, a.technicianId FROM dbo.ThanhToan p JOIN dbo.PhieuNghiemThu a ON a.id=p.acceptanceId WHERE p.orderId=@id', { id: oid }, t);
    if (!p) fail(409, 'PAYMENT_REQUIRED', 'Chỉ đánh giá sau khi đã thanh toán.');
    if (await one('SELECT id FROM dbo.DanhGia WHERE orderId=@id', { id: oid }, t)) {
      fail(409, 'REVIEW_ALREADY_EXISTS', 'Bạn đã đánh giá đơn này.');
    }
    const created = await one(
      'INSERT dbo.DanhGia(orderId,customerId,technicianId,rating,comment) VALUES(@oid,@uid,@kid,@rating,@comment); SELECT * FROM dbo.DanhGia WHERE id=SCOPE_IDENTITY()',
      { oid, uid: req.user.id, kid: p.technicianId, ...b },
      t
    );
    // Nếu đánh giá <= 3 sao, gửi thông báo cho đội CSKH để chăm sóc kịp thời
    if (b.rating <= 3) {
      const cskhUsers = await q("SELECT id FROM dbo.NguoiDung WHERE role='CSKH' AND isActive=1", {}, t);
      for (const staff of cskhUsers) {
        await notify(t, staff.id, oid, 'Cảnh báo đánh giá thấp', `Đơn #${oid} vừa nhận đánh giá ${b.rating} sao từ khách hàng.`);
      }
    }
    return created;
  });
  ok(res, review, 201);
}));

// Danh sách đánh giá (hỗ trợ lọc đánh giá kém <= 3 sao cho CSKH)
supportRouter.get('/support/reviews', roles('CSKH', 'GD', 'ADMIN'), wrap(async (req, res) => {
  const p = page(req);
  let where = '1=1';
  const params = { offset: (p.page - 1) * p.pageSize, limit: p.pageSize };

  if (req.query.maxRating) {
    where += ' AND r.rating <= @maxRating';
    params.maxRating = Number(req.query.maxRating);
  }
  if (req.query.rating && req.query.rating !== 'All') {
    where += ' AND r.rating = @rating';
    params.rating = Number(req.query.rating);
  }
  if (req.query.q) {
    where += ' AND (r.comment LIKE @q OR c.fullName LIKE @q OR c.phone LIKE @q OR CAST(r.orderId AS varchar) LIKE @q OR k.fullName LIKE @q)';
    params.q = `%${req.query.q}%`;
  }

  const total = await one(`
    SELECT COUNT(*) total
    FROM dbo.DanhGia r
    JOIN dbo.NguoiDung c ON c.id = r.customerId
    JOIN dbo.NguoiDung k ON k.id = r.technicianId
    WHERE ${where}
  `, params);

  const rows = await q(`
    SELECT r.*,
           c.fullName customerName, c.phone customerPhone,
           k.fullName technicianName, k.phone technicianPhone,
           d.serviceName, d.address orderAddress, d.status orderStatus,
           (SELECT TOP 1 id FROM dbo.YeuCauHoTro t WHERE t.orderId = r.orderId ORDER BY t.id DESC) ticketId,
           (SELECT TOP 1 status FROM dbo.YeuCauHoTro t WHERE t.orderId = r.orderId ORDER BY t.id DESC) ticketStatus,
           (SELECT TOP 1 type FROM dbo.YeuCauHoTro t WHERE t.orderId = r.orderId ORDER BY t.id DESC) ticketType
    FROM dbo.DanhGia r
    JOIN dbo.NguoiDung c ON c.id = r.customerId
    JOIN dbo.NguoiDung k ON k.id = r.technicianId
    JOIN dbo.DonHang d ON d.id = r.orderId
    WHERE ${where}
    ORDER BY r.id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `, params);

  ok(res, rows, 200, { ...p, total: total?.total || 0 });
}));

/* ============================================================
   2. TỔNG QUAN & DASHBOARD CSKH
   ============================================================ */

supportRouter.get('/support/summary', roles('CSKH', 'GD', 'ADMIN'), wrap(async (req, res) => {
  const stats = await one(`
    SELECT
      (SELECT COUNT(*) FROM dbo.YeuCauHoTro WHERE type='Complaint' AND status IN ('Open', 'InProgress')) openComplaints,
      (SELECT COUNT(*) FROM dbo.YeuCauHoTro WHERE type='Warranty' AND status IN ('Open', 'InProgress')) openWarranties,
      (SELECT COUNT(*) FROM dbo.YeuCauHoTro WHERE status IN ('Open', 'InProgress')) totalPending,
      (SELECT COUNT(*) FROM dbo.YeuCauHoTro WHERE status='Resolved') resolvedCount,
      (SELECT COUNT(*) FROM dbo.YeuCauHoTro WHERE status='Rejected') rejectedCount,
      (SELECT COUNT(*) FROM dbo.DanhGia WHERE rating <= 3) lowReviewsCount,
      (SELECT COUNT(*) FROM dbo.DanhGia) totalReviewsCount,
      (SELECT AVG(CAST(rating AS decimal(3,2))) FROM dbo.DanhGia) averageRating
  `);

  const recentTickets = await q(`
    SELECT TOP 6 t.*,
           n.fullName customerName, n.phone customerPhone,
           d.serviceName, d.address orderAddress,
           ktv.fullName technicianName
    FROM dbo.YeuCauHoTro t
    JOIN dbo.NguoiDung n ON n.id = t.customerId
    JOIN dbo.DonHang d ON d.id = t.orderId
    LEFT JOIN dbo.NguoiDung ktv ON ktv.id = d.assignedTechnicianId
    ORDER BY CASE WHEN t.status IN ('Open', 'InProgress') THEN 0 ELSE 1 END, t.id DESC
  `);

  const recentLowReviews = await q(`
    SELECT TOP 5 r.*,
           c.fullName customerName, c.phone customerPhone,
           k.fullName technicianName,
           d.serviceName
    FROM dbo.DanhGia r
    JOIN dbo.NguoiDung c ON c.id = r.customerId
    JOIN dbo.NguoiDung k ON k.id = r.technicianId
    JOIN dbo.DonHang d ON d.id = r.orderId
    WHERE r.rating <= 3
    ORDER BY r.id DESC
  `);

  ok(res, {
    openComplaints: Number(stats?.openComplaints || 0),
    openWarranties: Number(stats?.openWarranties || 0),
    totalPending: Number(stats?.totalPending || 0),
    resolvedCount: Number(stats?.resolvedCount || 0),
    rejectedCount: Number(stats?.rejectedCount || 0),
    lowReviewsCount: Number(stats?.lowReviewsCount || 0),
    totalReviewsCount: Number(stats?.totalReviewsCount || 0),
    averageRating: stats?.averageRating ? Number(stats.averageRating).toFixed(1) : '5.0',
    recentTickets,
    recentLowReviews
  });
}));

/* ============================================================
   3. TÌM KIẾM ĐƠN ĐỂ TIẾP NHẬN PHIẾU & KIỂM TRA BẢO HÀNH
   ============================================================ */

// Tìm kiếm nhanh đơn hàng (cho CSKH khi tạo phiếu qua điện thoại/chat)
supportRouter.get('/support/orders/search', roles('CSKH', 'ADMIN'), wrap(async (req, res) => {
  const query = String(req.query.q || req.query.orderId || req.query.phone || req.query.name || '').trim();
  if (!query) return ok(res, []);

  // Trích xuất số nếu người dùng gõ HF-001003, HF-1003, #1003 hoặc số nguyên
  const cleanCode = query.replace(/^HF-?/i, '').replace(/^#/, '').trim();
  let numId = 0;
  if (/^\d{1,8}$/.test(cleanCode)) {
    numId = parseInt(cleanCode, 10);
  }

  const rows = await q(`
    SELECT TOP 15 d.id, d.serviceName, d.serviceGroup, d.address, d.status, d.contactName, d.contactPhone,
           (SELECT TOP 1 total FROM dbo.PhieuNghiemThu WHERE orderId=d.id AND status='Approved') totalAmount, d.createdAt, d.assignedTechnicianId,
           ktv.fullName technicianName, ktv.phone technicianPhone,
           a.decidedAt acceptanceDate,
           (SELECT COUNT(*) FROM dbo.YeuCauHoTro WHERE orderId=d.id AND status IN ('Open', 'InProgress')) activeTicketsCount
    FROM dbo.DonHang d
    LEFT JOIN dbo.NguoiDung ktv ON ktv.id = d.assignedTechnicianId
    LEFT JOIN dbo.PhieuNghiemThu a ON a.orderId = d.id AND a.status = 'Approved'
    WHERE (@numId > 0 AND d.id = @numId)
       OR CAST(d.id AS varchar) LIKE @q
       OR ('HF-' + RIGHT('000000' + CAST(d.id AS varchar), 6)) LIKE @q
       OR d.contactPhone LIKE @q
       OR d.contactName LIKE @q
       OR d.address LIKE @q
    ORDER BY d.id DESC
  `, { q: `%${query}%`, numId });
  ok(res, rows);
}));

// Tra cứu điều kiện bảo hành của một đơn hàng
supportRouter.get('/support/orders/:id/warranty-info', roles('CSKH', 'KH', 'ADMIN'), wrap(async (req, res) => {
  const oid = id(req.params.id);
  const o = await getOrder(oid, req.user);
  const acceptance = await one(
    "SELECT TOP 1 a.*, q.total materialTotal FROM dbo.PhieuNghiemThu a LEFT JOIN dbo.DeXuatVatTu q ON q.id=a.materialQuoteId WHERE a.orderId=@id AND a.status='Approved' ORDER BY a.id DESC",
    { id: oid }
  );

  let materials = [];
  if (acceptance?.materialQuoteId) {
    materials = await q(`
      SELECT i.*,
             DATEADD(month, i.warrantyMonths, @decidedAt) warrantyExpiresAt,
             CASE WHEN DATEADD(month, i.warrantyMonths, @decidedAt) >= SYSUTCDATETIME() THEN 1 ELSE 0 END isUnderWarranty
      FROM dbo.ChiTietDeXuatVatTu i
      WHERE i.quoteId = @qid
    `, { qid: acceptance.materialQuoteId, decidedAt: acceptance.decidedAt });
  }

  const technician = o.assignedTechnicianId
    ? await one('SELECT id, fullName, phone FROM dbo.NguoiDung WHERE id=@id', { id: o.assignedTechnicianId })
    : null;

  const existingTickets = await q(
    'SELECT * FROM dbo.YeuCauHoTro WHERE orderId=@id ORDER BY id DESC',
    { id: oid }
  );

  // Mặc định bảo hành tay nghề/dịch vụ 30 ngày kể từ ngày nghiệm thu
  const acceptanceDate = acceptance ? new Date(acceptance.decidedAt) : null;
  const serviceWarrantyExpiresAt = acceptanceDate
    ? new Date(acceptanceDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;
  const isServiceWarrantyValid = serviceWarrantyExpiresAt ? serviceWarrantyExpiresAt >= new Date() : false;

  ok(res, {
    order: o,
    acceptance,
    materials,
    technician,
    serviceWarrantyDays: 30,
    serviceWarrantyExpiresAt,
    isServiceWarrantyValid,
    existingTickets
  });
}));

/* ============================================================
   4. QUẢN LÝ PHIẾU HỖ TRỢ / KHIẾU NẠI / BẢO HÀNH (TICKETS)
   ============================================================ */

// Danh sách phiếu hỗ trợ
supportRouter.get('/support/tickets', roles('KH', 'CSKH', 'ADMIN'), wrap(async (req, res) => {
  const p = page(req);
  let where = '1=1';
  const params = { uid: req.user.id, offset: (p.page - 1) * p.pageSize, limit: p.pageSize };

  if (req.user.role === 'KH') {
    where += ' AND t.customerId=@uid';
  } else {
    if (req.query.type && req.query.type !== 'All') {
      where += ' AND t.type=@type';
      params.type = req.query.type;
    }
    if (req.query.status && req.query.status !== 'All') {
      where += ' AND t.status=@status';
      params.status = req.query.status;
    }
    if (req.query.q) {
      where += ' AND (t.description LIKE @q OR n.fullName LIKE @q OR n.phone LIKE @q OR CAST(t.orderId AS varchar) LIKE @q OR CAST(t.id AS varchar) LIKE @q)';
      params.q = `%${req.query.q}%`;
    }
  }

  const total = await one(`
    SELECT COUNT(*) total
    FROM dbo.YeuCauHoTro t
    JOIN dbo.NguoiDung n ON n.id = t.customerId
    WHERE ${where}
  `, params);

  const rows = await q(`
    SELECT t.*,
           n.fullName customerName, n.phone customerPhone,
           d.serviceName, d.address orderAddress, d.status orderStatus, (SELECT TOP 1 total FROM dbo.PhieuNghiemThu WHERE orderId=d.id AND status='Approved') totalAmount, d.createdAt orderCreatedAt,
           d.assignedTechnicianId, ktvUser.fullName technicianName, ktvUser.phone technicianPhone,
           staff.fullName assignedStaffName
    FROM dbo.YeuCauHoTro t
    JOIN dbo.NguoiDung n ON n.id = t.customerId
    JOIN dbo.DonHang d ON d.id = t.orderId
    LEFT JOIN dbo.NguoiDung ktvUser ON ktvUser.id = d.assignedTechnicianId
    LEFT JOIN dbo.NguoiDung staff ON staff.id = t.assignedTo
    WHERE ${where}
    ORDER BY CASE WHEN t.status IN ('Open', 'InProgress') THEN 0 ELSE 1 END, t.id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `, params);

  ok(res, rows, 200, { ...p, total: total?.total || 0 });
}));

// Tạo phiếu mới (Khách hàng hoặc CSKH tạo thay qua hotline/chat)
supportRouter.post('/support/tickets', roles('KH', 'CSKH'), wrap(async (req, res) => {
  const b = z.strictObject({
    orderId: z.number().int().positive(),
    type: z.enum(['Complaint', 'Warranty']),
    description: str(10, 2000),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
    category: z.string().max(80).optional(),
    initialAction: z.string().max(1000).optional()
  }).parse(req.body);

  const isStaff = req.user.role === 'CSKH';

  const ticket = await transaction(req.user, async t => {
    const o = await getOrder(b.orderId, req.user, t);
    const customerId = o.customerId;

    const a = await one(
      "SELECT *, DATEADD(day, 7, decidedAt) complaintUntil FROM dbo.PhieuNghiemThu WHERE orderId=@id AND status='Approved'",
      { id: o.id },
      t
    );

    // Khiếu nại từ khách hàng: kiểm tra hạn 7 ngày nếu không phải CSKH mở
    if (b.type === 'Complaint' && !isStaff && a && new Date(a.complaintUntil) < new Date()) {
      fail(409, 'COMPLAINT_WINDOW_CLOSED', 'Đã quá 7 ngày từ nghiệm thu. Vui lòng liên hệ tổng đài để xem xét.');
    }

    // Bảo hành: kiểm tra nghiệm thu
    if (b.type === 'Warranty') {
      if (!a && !isStaff) {
        fail(409, 'ACCEPTANCE_REQUIRED', 'Đơn cần được nghiệm thu trước khi yêu cầu bảo hành.');
      }
      if (!isStaff) {
        const warranty = await one(
          'SELECT MAX(DATEADD(month, i.warrantyMonths, @approvedAt)) expires FROM dbo.ChiTietDeXuatVatTu i WHERE quoteId=@qid AND warrantyMonths>0',
          { approvedAt: new Date(a.decidedAt), qid: a.materialQuoteId },
          t
        );
        const serviceWarrantyValid = a.decidedAt && (new Date().getTime() - new Date(a.decidedAt).getTime()) <= 30 * 24 * 60 * 60 * 1000;
        if (!serviceWarrantyValid && (!warranty?.expires || new Date(warranty.expires) < new Date())) {
          fail(409, 'WARRANTY_EXPIRED', 'Đơn hàng không còn linh kiện hoặc dịch vụ trong thời hạn bảo hành.');
        }
      }
    }

    // Kiểm tra trùng yêu cầu đang mở
    if (await one("SELECT id FROM dbo.YeuCauHoTro WHERE orderId=@oid AND type=@type AND status IN ('Open', 'InProgress')", { oid: o.id, type: b.type }, t)) {
      fail(409, 'OPEN_TICKET_EXISTS', 'Đã có yêu cầu cùng loại đang được xử lý cho đơn hàng này.');
    }

    const assignedTo = isStaff ? req.user.id : null;
    let desc = b.description;
    if (b.category || b.priority) {
      desc = `[${b.type === 'Complaint' ? 'KHIẾU NẠI' : 'BẢO HÀNH'}${b.category ? ` · ${b.category}` : ''}${b.priority ? ` · Ưu tiên: ${b.priority}` : ''}]\n${desc}`;
    }

    const row = await one(
      'INSERT dbo.YeuCauHoTro(orderId, customerId, type, description, assignedTo) OUTPUT INSERTED.* VALUES(@orderId, @customerId, @type, @desc, @assignedTo)',
      { orderId: o.id, customerId, type: b.type, desc, assignedTo },
      t
    );

    const initialNote = isStaff
      ? (b.initialAction ? `[CSKH tiếp nhận] ${b.initialAction}` : 'Nhân viên CSKH đã tiếp nhận và lập phiếu hỗ trợ.')
      : b.description;

    await q(
      "INSERT dbo.LichSuHoTro(ticketId, actorId, status, note) VALUES(@id, @uid, 'Open', @note)",
      { id: row.id, uid: req.user.id, note: initialNote },
      t
    );

    if (isStaff) {
      await notify(t, customerId, o.id, 'HomeFix đã tiếp nhận yêu cầu hỗ trợ', `Phiếu HT-${row.id} đã được tạo và đang được xử lý.`);
    }

    await audit(t, req.user, 'CreateTicket', 'YeuCauHoTro', row.id, b.type);
    return row;
  });

  ok(res, ticket, 201);
}));

// Chi tiết phiếu hỗ trợ kèm lịch sử tương tác và thông tin đơn
supportRouter.get('/support/tickets/:id', roles('KH', 'CSKH', 'ADMIN'), wrap(async (req, res) => {
  const tid = id(req.params.id);
  const t = await one('SELECT * FROM dbo.YeuCauHoTro WHERE id=@id', { id: tid });
  if (!t || (req.user.role === 'KH' && t.customerId !== req.user.id)) {
    fail(404, 'NOT_FOUND', 'Không tìm thấy yêu cầu.');
  }

  const order = await one(`
    SELECT d.*, n.fullName technicianName, n.phone technicianPhone,
           c.fullName customerName, c.phone customerPhone
    FROM dbo.DonHang d
    JOIN dbo.NguoiDung c ON c.id = d.customerId
    LEFT JOIN dbo.NguoiDung n ON n.id = d.assignedTechnicianId
    WHERE d.id = @id
  `, { id: t.orderId });

  const history = await q(`
    SELECT h.*, n.fullName actorName, n.role actorRole
    FROM dbo.LichSuHoTro h
    JOIN dbo.NguoiDung n ON n.id = h.actorId
    WHERE ticketId = @id
    ORDER BY h.id ASC
  `, { id: tid });

  const assignedStaff = t.assignedTo
    ? await one('SELECT id, fullName, phone FROM dbo.NguoiDung WHERE id=@id', { id: t.assignedTo })
    : null;

  ok(res, {
    ...t,
    order,
    history,
    assignedStaff
  });
}));

// Thêm ghi chú tiến độ / cuộc gọi CSKH (không đổi trạng thái chính)
supportRouter.post('/support/tickets/:id/notes', roles('CSKH', 'ADMIN'), wrap(async (req, res) => {
  const tid = id(req.params.id);
  const b = z.strictObject({
    note: str(3, 2000),
    contactType: z.enum(['Call', 'Chat', 'Internal', 'Meeting']).optional()
  }).parse(req.body);

  const result = await transaction(req.user, async t => {
    const ticket = await one('SELECT * FROM dbo.YeuCauHoTro WHERE id=@id', { id: tid }, t);
    if (!ticket) fail(404, 'NOT_FOUND', 'Không tìm thấy phiếu hỗ trợ.');

    const notePrefix = b.contactType
      ? `[${b.contactType === 'Call' ? 'Cuộc gọi' : b.contactType === 'Chat' ? 'Tin nhắn' : b.contactType === 'Meeting' ? 'Gặp trực tiếp' : 'Ghi chú nội bộ'}] `
      : '';

    const entry = await one(
      'INSERT dbo.LichSuHoTro(ticketId, actorId, status, note) OUTPUT INSERTED.* VALUES(@id, @uid, @status, @note)',
      { id: tid, uid: req.user.id, status: ticket.status, note: notePrefix + b.note },
      t
    );

    await q('UPDATE dbo.YeuCauHoTro SET updatedAt=SYSUTCDATETIME(), assignedTo=COALESCE(assignedTo, @uid) WHERE id=@id', { id: tid, uid: req.user.id }, t);
    return entry;
  });

  ok(res, result, 201);
}));

// Cập nhật trạng thái phiếu (Đang xử lý, Giải quyết, Từ chối / Đóng / Hủy)
supportRouter.patch('/support/tickets/:id', roles('CSKH', 'ADMIN'), wrap(async (req, res) => {
  const tid = id(req.params.id);
  const b = z.strictObject({
    status: z.enum(['InProgress', 'Resolved', 'Rejected']),
    resolution: str(5, 2000),
    actionType: z.string().max(80).optional(),
    expectedVersion: versionSchema
  }).parse(req.body);

  const updated = await transaction(req.user, async t => {
    const ticket = await one('SELECT * FROM dbo.YeuCauHoTro WHERE id=@id', { id: tid }, t);
    checkVersion(ticket, b.expectedVersion);
    state(ticket, 'Open', 'InProgress');

    let resolutionText = b.resolution;
    if (b.actionType) {
      resolutionText = `[Phương án: ${b.actionType}] ${resolutionText}`;
    }

    await q(
      'UPDATE dbo.YeuCauHoTro SET status=@status, resolution=@resolution, assignedTo=@uid, updatedAt=SYSUTCDATETIME() WHERE id=@id',
      { id: tid, uid: req.user.id, status: b.status, resolution: resolutionText },
      t
    );

    await q(
      'INSERT dbo.LichSuHoTro(ticketId, actorId, status, note) VALUES(@id, @uid, @status, @note)',
      { id: tid, uid: req.user.id, status: b.status, note: resolutionText },
      t
    );

    const titleMap = {
      InProgress: 'Yêu cầu hỗ trợ đang được xử lý',
      Resolved: 'Yêu cầu hỗ trợ đã được giải quyết',
      Rejected: 'Phản hồi về yêu cầu hỗ trợ'
    };

    await notify(t, ticket.customerId, ticket.orderId, titleMap[b.status], resolutionText);
    await audit(t, req.user, 'UpdateTicket', 'YeuCauHoTro', tid, b.status);

    return one('SELECT * FROM dbo.YeuCauHoTro WHERE id=@id', { id: tid }, t);
  });

  ok(res, updated);
}));
