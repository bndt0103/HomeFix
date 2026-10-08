import { Router } from 'express';
import { q, one, transaction } from './db.js';
import { z, str, id, ok, wrap, fail, roles, idempotent, page } from './common.js';
import { geminiAvailable, generateSupportReply, geminiSettings } from './gemini.js';
const threadSelect = `
  Select
      h.MaHoiThoai id,
      h.MaKhachHang customerId,
      h.MaNhanVien staffId,
      h.CheDo mode,
      h.MaTinNhanDangXuLy pendingMessageId,
      h.NgayTao createdAt,
      h.NgayCapNhat updatedAt,
      h.DongYGuiAI aiConsent,
      h.NgayDongYAI aiConsentAt,
      Case
          When h.MaTinNhanDangXuLy Is Not Null
          And h.NgayBatDauAI < DateAdd(second, -90, SysUtcDateTime()) Then Cast(1 As Bit)
          Else Cast(0 As Bit)
      End stalePending,
      h.TinCuoiKhachDaDoc customerReadThrough,
      h.TinCuoiNhanVienDaDoc staffReadThrough,
      n.fullName customerName,
      s.fullName staffName
  From
      dbo.HoiThoaiHoTro h
      Join dbo.NguoiDung n On n.id = h.MaKhachHang
      Left Join dbo.NguoiDung s On s.id = h.MaNhanVien
`;
const messageSelect = `
  Select
      m.MaTinNhan id,
      m.MaHoiThoai conversationId,
      m.MaNguoiGui authorId,
      m.VaiTroNguoiGui authorRole,
      m.NoiDung text,
      m.NgayGui createdAt,
      m.CheDoGui mode,
      Case m.VaiTroNguoiGui
          When 'AI' Then N'Trợ lý AI'
          When 'HeThong' Then N'HomeFix'
          Else n.fullName
      End authorName
  From
      dbo.TinNhanHoTro m
      Left Join dbo.NguoiDung n On n.id = m.MaNguoiGui
`;
async function thread(cid, user, t) {
  const row = await one(threadSelect + ' Where h.MaHoiThoai=@id', { id: cid }, t);
  if (!row || (user.role === 'KH' && row.customerId !== user.id))
    fail(404, 'NOT_FOUND', 'Không tìm thấy cuộc trò chuyện.');
  if (row.stalePending && !t)
    return transaction(user, async (tx) => {
      const current = await thread(cid, user, tx);
      if (current.stalePending)
        await humanFallback(
          tx,
          current,
          'Trợ lý AI chưa thể trả lời. Cuộc trò chuyện đã được chuyển sang nhân viên hỗ trợ.',
        );
      return thread(cid, user, tx);
    });
  return row;
}
async function notification(t, userId, title, body, path) {
  await q(
    `
      Insert
          dbo.ThongBao (userId, title, body, DuongDan)
      Values
          (@uid, @title, @body, @path)
    `,
    { uid: userId, title, body: body.slice(0, 1000), path },
    t,
  );
}
async function notifyStaff(t, conversation, text) {
  const staff = await q(
    `
      Select
          id
      From
          dbo.NguoiDung
      Where
      role = 'CSKH'
      And isActive = 1
      And (
          lockedUntil Is Null
          Or lockedUntil <= SysUtcDateTime()
      )
      And (
          @sid Is Null
          Or id = @sid
      )
    `,
    { sid: conversation.staffId },
    t,
  );
  const recipients = staff.length
    ? staff
    : await q(
        `
          Select
              id
          From
              dbo.NguoiDung
          Where
          role = 'CSKH'
          And isActive = 1
          And (
              lockedUntil Is Null
              Or lockedUntil <= SysUtcDateTime()
          )
        `,
        {},
        t,
      );
  for (const user of recipients)
    await notification(
      t,
      user.id,
      'Tin nhắn hỗ trợ khách hàng',
      conversation.customerName + ' · ' + text,
      '/support/messages?conversationId=' + conversation.id,
    );
}
async function saveMessage(t, cid, authorId, role, text, mode = 'NhanVien', model = null) {
  const created = await one(
    `
      Insert
          dbo.TinNhanHoTro (
              MaHoiThoai,
              MaNguoiGui,
              VaiTroNguoiGui,
              NoiDung,
              CheDoGui,
              MoHinhAI
          ) Output Inserted.MaTinNhan id
      Values
          (@cid, @uid, @role, @text, @mode, @model)
    `,
    { cid, uid: authorId, role, text, mode, model },
    t,
  );
  await q(
    `
      Update dbo.HoiThoaiHoTro
      Set
          NgayCapNhat = SysUtcDateTime()
      Where
          MaHoiThoai = @cid
    `,
    { cid },
    t,
  );
  return one(messageSelect + ' Where m.MaTinNhan=@id', { id: created.id }, t);
}
async function humanFallback(t, current, text) {
  await q(
    `
      Update dbo.HoiThoaiHoTro
      Set
          CheDo = 'NhanVien',
          DongYGuiAI = 0,
          MaTinNhanDangXuLy = Null,
          NgayBatDauAI = Null,
          NgayCapNhat = SysUtcDateTime()
      Where
          MaHoiThoai = @cid
    `,
    { cid: current.id },
    t,
  );
  const system = await saveMessage(t, current.id, null, 'HeThong', text);
  const latest = await one(
    `
      Select
          Top 1 NoiDung text
      From
          dbo.TinNhanHoTro
      Where
          MaHoiThoai = @cid
          And VaiTroNguoiGui = 'KH'
      Order By
          MaTinNhan Desc
    `,
    { cid: current.id },
    t,
  );
  await notifyStaff(t, current, latest?.text || text);
  return system;
}
export async function recoverStaleSupportChats() {
  const condition =
    "h.CheDo='AI' And h.MaTinNhanDangXuLy Is Not Null And h.NgayBatDauAI<DateAdd(second,-90,SysUtcDateTime())";
  if (
    !(await one(
      `
        Select
            Top 1 h.MaHoiThoai
        From
            dbo.HoiThoaiHoTro h
        Where
      ` + condition,
    ))
  )
    return;
  await transaction(null, async (t) => {
    const rows = await q(threadSelect + ' Where ' + condition, {}, t);
    for (const current of rows)
      await humanFallback(
        t,
        current,
        'Trợ lý AI chưa thể trả lời. Cuộc trò chuyện đã được chuyển sang nhân viên hỗ trợ.',
      );
  });
}
async function updateRetryResult(t, req, data) {
  await q(
    `
      Update dbo.Idempotency
      Set
          resultJson = @json
      Where
          actorId = @uid
          And
      route = @route
      And requestKey = @key
    `,
    {
      json: JSON.stringify(data),
      uid: req.user.id,
      route: `${req.method} ${req.path}`,
      key: req.get('Idempotency-Key'),
    },
    t,
  );
}
export function createSupportChatRouter({
  available = geminiAvailable,
  generate = generateSupportReply,
  getSettings = geminiSettings,
  logFailure = (code) => console.warn(JSON.stringify({ event: 'GeminiSupportFailure', code })),
} = {}) {
  const supportChatRouter = Router();
  supportChatRouter.get(
    '/support-chat/status',
    roles('KH', 'CSKH', 'ADMIN'),
    wrap(async (req, res) => ok(res, { available: available() })),
  );
  supportChatRouter.get(
    '/support-chat/me',
    roles('KH'),
    wrap(async (req, res) => {
      const current = await one(
        `
          Select
              MaHoiThoai id
          From
              dbo.HoiThoaiHoTro
          Where
              MaKhachHang = @uid
        `,
        { uid: req.user.id },
      );
      ok(res, current ? await thread(current.id, req.user) : null);
    }),
  );
  supportChatRouter.post(
    '/support-chat',
    roles('KH'),
    wrap(async (req, res) => {
      z.strictObject({}).parse(req.body);
      const row = await transaction(req.user, async (t) => {
        let current = await one(
          threadSelect + ' Where h.MaKhachHang=@uid',
          { uid: req.user.id },
          t,
        );
        if (!current) {
          const created = await one(
            `
              Insert
                  dbo.HoiThoaiHoTro (MaKhachHang) Output Inserted.MaHoiThoai id
              Values
                  (@uid)
            `,
            { uid: req.user.id },
            t,
          );
          current = await thread(created.id, req.user, t);
        }
        return current;
      });
      ok(res, row);
    }),
  );
  supportChatRouter.get(
    '/support-chat/conversations',
    roles('CSKH'),
    wrap(async (req, res) => {
      const p = page(req),
        params = { uid: req.user.id, offset: (p.page - 1) * p.pageSize, limit: p.pageSize };
      const visible =
        "h.CheDo='NhanVien' And (h.MaNhanVien Is Null Or h.MaNhanVien=@uid Or Not Exists(Select 1 From dbo.NguoiDung s Where s.id=h.MaNhanVien And s.isActive=1 And (s.lockedUntil Is Null Or s.lockedUntil<=SysUtcDateTime())))";
      const total = await one(
        `
          Select
              Count(*) n
          From
              dbo.HoiThoaiHoTro h
          Where
        ` + visible,
        params,
      );
      const rows = await q(
        `
          Select
              h.MaHoiThoai id,
              h.CheDo mode,
              h.MaNhanVien staffId,
              n.fullName customerName,
              latest.NoiDung lastMessage,
              latest.NgayGui lastMessageAt,
              (
                  Select
                      Count(*)
                  From
                      dbo.TinNhanHoTro m
                  Where
                      m.MaHoiThoai = h.MaHoiThoai
                      And m.VaiTroNguoiGui = 'KH'
                      And m.MaTinNhan > h.TinCuoiNhanVienDaDoc
              ) unreadCount
          From
              dbo.HoiThoaiHoTro h
              Join dbo.NguoiDung n On n.id = h.MaKhachHang
              Outer Apply (
                  Select
                      Top 1 m.NoiDung,
                      m.NgayGui
                  From
                      dbo.TinNhanHoTro m
                  Where
                      m.MaHoiThoai = h.MaHoiThoai
                  Order By
                      m.MaTinNhan Desc
              ) latest
          Where
              ${visible}
          Order By
              unreadCount Desc,
              h.NgayCapNhat Desc
          Offset
              @offset Rows
          Fetch Next
              @limit Rows Only
        `,
        params,
      );
      ok(res, rows, 200, { ...p, total: total.n });
    }),
  );
  supportChatRouter.get(
    '/support-chat/:id',
    roles('KH', 'CSKH'),
    wrap(async (req, res) => ok(res, await thread(id(req.params.id), req.user))),
  );
  supportChatRouter.patch(
    '/support-chat/:id/mode',
    roles('KH'),
    wrap(async (req, res) => {
      const body = z
          .strictObject({ mode: z.enum(['AI', 'NhanVien']), aiConsent: z.boolean().optional() })
          .parse(req.body),
        cid = id(req.params.id);
      await thread(cid, req.user);
      if (body.mode === 'AI' && !available())
        fail(422, 'AI_UNAVAILABLE', 'Trợ lý AI chưa sẵn sàng. Bạn có thể gặp nhân viên hỗ trợ.');
      if (body.mode === 'AI' && body.aiConsent !== true)
        fail(
          422,
          'AI_CONSENT_REQUIRED',
          'Vui lòng đồng ý gửi nội dung chat AI đến Google Gemini trước khi bắt đầu.',
        );
      ok(
        res,
        await transaction(req.user, async (t) => {
          const current = await thread(cid, req.user, t);
          if (current.mode === body.mode && (body.mode !== 'AI' || current.aiConsent))
            return current;
          if (body.mode === 'AI') {
            await q(
              `
                Update dbo.HoiThoaiHoTro
                Set
                    CheDo = 'AI',
                    DongYGuiAI = 1,
                    NgayDongYAI = SysUtcDateTime(),
                    NgayCapNhat = SysUtcDateTime()
                Where
                    MaHoiThoai = @cid
              `,
              { cid },
              t,
            );
            await saveMessage(
              t,
              cid,
              null,
              'HeThong',
              'Đã chuyển sang trợ lý AI. Bạn có thể chọn Gặp nhân viên bất cứ lúc nào.',
              'AI',
            );
          } else await humanFallback(t, current, 'Đã chuyển sang nhân viên hỗ trợ.');
          return thread(cid, req.user, t);
        }),
      );
    }),
  );
  supportChatRouter.post(
    '/support-chat/:id/claim',
    roles('CSKH'),
    wrap(async (req, res) => {
      z.strictObject({}).parse(req.body);
      const cid = id(req.params.id);
      ok(
        res,
        await transaction(req.user, async (t) => {
          const current = await thread(cid, req.user, t);
          if (current.mode !== 'NhanVien')
            fail(409, 'CUSTOMER_CHOSE_AI', 'Chỉ tiếp nhận khi khách chọn gặp nhân viên.');
          if (
            current.staffId &&
            current.staffId !== req.user.id &&
            (await one(
              `
                Select
                    id
                From
                    dbo.NguoiDung
                Where
                    id = @id
                    And isActive = 1
                    And (
                        lockedUntil Is Null
                        Or lockedUntil <= SysUtcDateTime()
                    )
              `,
              { id: current.staffId },
              t,
            ))
          )
            fail(409, 'ALREADY_ASSIGNED', 'Một nhân viên khác đang hỗ trợ khách hàng này.');
          await q(
            `
              Update dbo.HoiThoaiHoTro
              Set
                  MaNhanVien = @uid
              Where
                  MaHoiThoai = @cid
            `,
            { uid: req.user.id, cid },
            t,
          );
          return thread(cid, req.user, t);
        }),
      );
    }),
  );
  supportChatRouter.get(
    '/support-chat/:id/messages',
    roles('KH', 'CSKH'),
    wrap(async (req, res) => {
      const cid = id(req.params.id);
      await thread(cid, req.user);
      const before = req.query.before ? id(req.query.before) : 2147483647;
      const rows = await q(
        messageSelect +
          ' Where m.MaHoiThoai=@cid And m.MaTinNhan<@before Order By m.MaTinNhan Desc Offset 0 Rows Fetch Next 51 Rows Only',
        { cid, before },
      );
      const hasOlder = rows.length > 50,
        data = rows.slice(0, 50).reverse();
      ok(res, data, 200, { hasOlder, nextCursor: hasOlder ? data[0]?.id : null });
    }),
  );
  supportChatRouter.post(
    '/support-chat/:id/read',
    roles('KH', 'CSKH'),
    wrap(async (req, res) => {
      const body = z.strictObject({ throughId: z.number().int().positive() }).parse(req.body),
        cid = id(req.params.id);
      await transaction(req.user, async (t) => {
        const current = await thread(cid, req.user, t);
        if (
          !(await one(
            `
              Select
                  MaTinNhan
              From
                  dbo.TinNhanHoTro
              Where
                  MaHoiThoai = @cid
                  And MaTinNhan = @mid
            `,
            { cid, mid: body.throughId },
            t,
          ))
        )
          fail(404, 'NOT_FOUND', 'Không tìm thấy tin nhắn.');
        if (req.user.role === 'CSKH' && current.mode !== 'NhanVien') return;
        const field = req.user.role === 'KH' ? 'TinCuoiKhachDaDoc' : 'TinCuoiNhanVienDaDoc';
        await q(
          `
            Update dbo.HoiThoaiHoTro
            Set
                ${field} = Case
                    When ${field} < @mid Then @mid
                    Else ${field}
                End
            Where
                MaHoiThoai = @cid
          `,
          { cid, mid: body.throughId },
          t,
        );
        const path =
          req.user.role === 'KH' ? '/support/chat' : '/support/messages?conversationId=' + cid;
        const incoming = req.user.role === 'KH' ? "('CSKH','AI','HeThong')" : "('KH')";
        if (
          !(await one(
            `
              Select
                  MaTinNhan
              From
                  dbo.TinNhanHoTro
              Where
                  MaHoiThoai = @cid
                  And MaTinNhan > @mid
                  And VaiTroNguoiGui In ${incoming}
            `,
            { cid, mid: body.throughId },
            t,
          ))
        )
          await q(
            `
              Update dbo.ThongBao
              Set
                  readAt = Coalesce(readAt, SysUtcDateTime())
              Where
                  userId = @uid
                  And DuongDan = @path
            `,
            { uid: req.user.id, path },
            t,
          );
      });
      ok(res, { read: true });
    }),
  );
  supportChatRouter.post(
    '/support-chat/:id/messages',
    roles('KH', 'CSKH'),
    wrap(async (req, res) => {
      const body = z.strictObject({ text: str(1, 2000) }).parse(req.body),
        cid = id(req.params.id);
      let job;
      const saved = await transaction(req.user, (t) =>
        idempotent(t, req, body, async () => {
          const current = await thread(cid, req.user, t);
          if (req.user.role === 'CSKH' && current.mode !== 'NhanVien')
            fail(409, 'CUSTOMER_CHOSE_AI', 'Chỉ trả lời khi khách chọn gặp nhân viên.');
          if (req.user.role === 'CSKH' && current.staffId !== req.user.id)
            fail(409, 'CLAIM_REQUIRED', 'Vui lòng tiếp nhận cuộc trò chuyện trước khi trả lời.');
          if (current.pendingMessageId)
            fail(
              409,
              'AI_REPLY_PENDING',
              'Trợ lý AI đang trả lời tin trước. Bạn có thể đợi hoặc chọn Gặp nhân viên.',
            );
          if (
            req.user.role === 'KH' &&
            (
              await one(
                `
                  Select
                      Count(*) n
                  From
                      dbo.TinNhanHoTro
                  Where
                      MaHoiThoai = @cid
                      And VaiTroNguoiGui = 'KH'
                      And NgayGui > DateAdd(minute, -1, SysUtcDateTime())
                `,
                { cid },
                t,
              )
            ).n >= 12
          )
            fail(
              429,
              'CHAT_RATE_LIMIT',
              'Bạn đã gửi nhiều tin nhắn liên tiếp. Vui lòng chờ một phút.',
            );
          const message = await saveMessage(
            t,
            cid,
            req.user.id,
            req.user.role,
            body.text,
            current.mode,
          );
          if (current.mode === 'AI') {
            const used = (
              await one(
                `
                  Select
                      Count(*) n
                  From
                      dbo.TinNhanHoTro
                  Where
                      VaiTroNguoiGui = 'KH'
                      And CheDoGui = 'AI'
                      And MoHinhAI Is Not Null
                      And NgayGui >= Convert(date, SysUtcDateTime())
                `,
                {},
                t,
              )
            ).n;
            if (!available() || !current.aiConsent || used >= getSettings().dailyLimit) {
              const reply = await humanFallback(
                t,
                current,
                'Trợ lý AI hiện chưa thể trả lời. Cuộc trò chuyện đã được chuyển sang nhân viên hỗ trợ.',
              );
              return { message, reply, pending: false, mode: 'NhanVien', fallback: true };
            }
            await q(
              `
                Update dbo.TinNhanHoTro
                Set
                    MoHinhAI = @model
                Where
                    MaTinNhan = @mid
              `,
              { model: getSettings().model, mid: message.id },
              t,
            );
            await q(
              `
                Update dbo.HoiThoaiHoTro
                Set
                    MaTinNhanDangXuLy = @mid,
                    NgayBatDauAI = SysUtcDateTime()
                Where
                    MaHoiThoai = @cid
              `,
              { mid: message.id, cid },
              t,
            );
            const history = await q(
              `
                Select
                    Top 24 m.NoiDung text,
                    m.VaiTroNguoiGui authorRole,
                    m.CheDoGui mode
                From
                    dbo.TinNhanHoTro m
                    Join dbo.HoiThoaiHoTro h On h.MaHoiThoai = m.MaHoiThoai
                Where
                    m.MaHoiThoai = @cid
                    And m.CheDoGui = 'AI'
                    And m.VaiTroNguoiGui In ('KH', 'AI')
                    And m.NgayGui >= h.NgayDongYAI
                Order By
                    m.MaTinNhan Desc
              `,
              { cid },
              t,
            );
            const services = await q(
              `
                Select
                    Top 100 name,
                    groupCode,
                    description,
                    inspectionFee,
                    laborFee
                From
                    dbo.DichVu
                Where
                    isActive = 1
                Order By
                    id
              `,
              {},
              t,
            );
            job = { history: history.reverse(), services };
            return { message, reply: null, pending: true, mode: 'AI' };
          }
          if (req.user.role === 'KH') await notifyStaff(t, current, body.text);
          else
            await notification(
              t,
              current.customerId,
              'Nhân viên hỗ trợ trả lời',
              body.text,
              '/support/chat',
            );
          return { message, reply: null };
        }),
      );
      if (!job) {
        if (saved.replay && saved.data.pending)
          await transaction(null, async (t) => {
            const current = await thread(cid, req.user, t);
            if (current.pendingMessageId !== saved.data.message.id) {
              saved.data = { ...saved.data, pending: false, mode: current.mode, cancelled: true };
              await updateRetryResult(t, req, saved.data);
            }
          });
        return ok(res, saved.data, saved.replay ? 200 : 201);
      }
      // Gọi AI sau khi lưu giao dịch để không giữ khóa dữ liệu khi chờ mạng.
      let response, error;
      try {
        response = await generate(job);
        if (!response?.text?.trim()) throw new Error('Empty AI response');
      } catch (caught) {
        error = caught;
        const code = /^GEMINI_[A-Z_]+$/.test(caught.code || '')
          ? caught.code
          : 'GEMINI_PROVIDER_ERROR';
        logFailure(code);
      }
      const result = await transaction(null, async (t) => {
        const current = await thread(cid, req.user, t);
        let reply = null,
          fallback = false,
          cancelled = false;
        if (
          current.mode === 'AI' &&
          current.aiConsent &&
          current.pendingMessageId === saved.data.message.id
        ) {
          if (error) {
            reply = await humanFallback(
              t,
              current,
              'Trợ lý AI chưa thể trả lời. Cuộc trò chuyện đã được chuyển sang nhân viên hỗ trợ.',
            );
            fallback = true;
          } else {
            reply = await saveMessage(
              t,
              cid,
              null,
              'AI',
              response.text.trim().slice(0, 4000),
              'AI',
              getSettings().model,
            );
            await q(
              `
                Update dbo.HoiThoaiHoTro
                Set
                    MaTinNhanDangXuLy = Null,
                    NgayBatDauAI = Null
                Where
                    MaHoiThoai = @cid
              `,
              { cid },
              t,
            );
          }
        } else cancelled = true;
        const data = {
          message: saved.data.message,
          reply,
          pending: false,
          mode: fallback ? 'NhanVien' : current.mode,
          fallback,
          cancelled,
        };
        await updateRetryResult(t, req, data);
        return data;
      });
      ok(res, result, 201);
    }),
  );
  return supportChatRouter;
}
export const supportChatRouter = createSupportChatRouter();
