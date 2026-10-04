import { sql, q, one, transaction, close } from '../backend/src/db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('--- Đang khởi tạo dữ liệu mẫu cho Chăm Sóc Khách Hàng (CSKH) ---');
  const hash = await bcrypt.hash('HomeFix@123', 12);

  await transaction(null, async t => {
    // 1. Đảm bảo tài khoản CSKH
    let cskh = await one("SELECT id FROM dbo.NguoiDung WHERE role='CSKH'", {}, t);
    if (!cskh) {
      cskh = await one(
        "INSERT dbo.NguoiDung(fullName, phone, email, passwordHash, role, defaultAddress) OUTPUT INSERTED.id VALUES(N'Chuyên viên CSKH Hoàng Lan', '0908000001', 'cskh@homefix.local', @hash, 'CSKH', N'Trung tâm CSKH HomeFix, Q1, TP.HCM')",
        { hash },
        t
      );
      console.log('Đã tạo tài khoản CSKH:', cskh.id);
    }

    // 2. Tìm hoặc tạo khách hàng & kỹ thuật viên
    let kh = await one("SELECT TOP 1 id, fullName, phone FROM dbo.NguoiDung WHERE role='KH'", {}, t);
    if (!kh) {
      kh = await one(
        "INSERT dbo.NguoiDung(fullName, phone, email, passwordHash, role, defaultAddress) OUTPUT INSERTED.id, INSERTED.fullName, INSERTED.phone VALUES(N'Nguyễn Thị Mai', '0918000001', 'khachhang@homefix.local', @hash, 'KH', N'123 Lê Lợi, Bến Nghé, Q1, TP.HCM')",
        { hash },
        t
      );
    }

    let ktv = await one("SELECT TOP 1 k.id, n.fullName, n.phone FROM dbo.KyThuatVien k JOIN dbo.NguoiDung n ON n.id=k.id", {}, t);
    if (!ktv) {
      const u = await one("INSERT dbo.NguoiDung(fullName, phone, email, passwordHash, role, defaultAddress) OUTPUT INSERTED.id, INSERTED.fullName, INSERTED.phone VALUES(N'Trần Văn Minh', '0971000001', 'ktv.minh@homefix.local', @hash, 'KTV', N'TP.HCM')", { hash }, t);
      await q("INSERT dbo.KyThuatVien(id,skillGroup,serviceArea,availability,balance) VALUES(@id,N'DienLanh',N'TP.HCM','SanSang',1500000)", { id: u.id }, t);
      ktv = u;
    }

    const service1 = await one("SELECT TOP 1 id, name, groupCode FROM dbo.DichVu WHERE groupCode='DienLanh'") || { id: 1, name: 'Sửa máy lạnh', groupCode: 'DienLanh' };
    const service2 = await one("SELECT TOP 1 id, name, groupCode FROM dbo.DichVu WHERE groupCode='DienNuoc'") || { id: 2, name: 'Sửa đường ống nước', groupCode: 'DienNuoc' };

    // 3. Đơn hoàn thành #1: Máy lạnh bị chảy nước + Khiếu nại thái độ + Đánh giá 2 sao
    let order1 = await one("SELECT id FROM dbo.DonHang WHERE contactPhone='0918000001' AND status='HoanThanh'", {}, t);
    if (!order1) {
      order1 = await one(`
        INSERT dbo.DonHang(customerId, serviceId, serviceName, serviceGroup, contactName, contactPhone, address, description, status, assignedTechnicianId)
        OUTPUT INSERTED.id
        VALUES(@cid, @sid, @sname, @sgroup, @cname, @cphone, N'123 Lê Lợi, Phường Bến Nghé, Quận 1', N'Máy lạnh Panasonic 1.5HP chảy nước ướt tường', 'HoanThanh', @kid)
      `, {
        cid: kh.id,
        sid: service1.id,
        sname: service1.name,
        sgroup: service1.groupCode,
        cname: kh.fullName,
        cphone: kh.phone,
        kid: ktv.id
      }, t);

      const acc1 = await one(`
        INSERT dbo.PhieuNghiemThu(orderId, technicianId, revision, cause, solution, inspectionFee, laborFee, materialTotal, status, decidedAt)
        OUTPUT INSERTED.id
        VALUES(@oid, @kid, 1, N'Ống thoát nước bị nghẹt rêu', N'Thông tắc ống và bơm ga bổ sung', 50000, 200000, 150000, 'Approved', DATEADD(day, -4, SYSUTCDATETIME()))
      `, { oid: order1.id, kid: ktv.id }, t);

      await q(`
        INSERT dbo.ThanhToan(orderId, acceptanceId, amount, method, status, receivedBy, paidAt)
        VALUES(@oid, @accId, 400000, 'COD', 'Paid', @kid, DATEADD(day, -4, SYSUTCDATETIME()))
      `, { oid: order1.id, accId: acc1.id, kid: ktv.id }, t);

      console.log('+ Đã tạo Đơn hoàn thành #1:', order1.id);
    }

    // Đánh giá 2 sao
    const rev1 = await one("SELECT id FROM dbo.DanhGia WHERE orderId=@oid", { oid: order1.id }, t);
    if (!rev1) {
      await q(`
        INSERT dbo.DanhGia(orderId, customerId, technicianId, rating, comment, createdAt)
        VALUES(@oid, @uid, @kid, 2, N'Kỹ thuật viên đến muộn gần 1 tiếng, tác phong chưa chuyên nghiệp, làm xong không dọn dẹp bụi bẩn dưới sàn.', DATEADD(day, -3, SYSUTCDATETIME()))
      `, { oid: order1.id, uid: kh.id, kid: ktv.id }, t);
      console.log('+ Đã tạo đánh giá 2 sao cho đơn #', order1.id);
    }

    // Phiếu Khiếu nại (Open)
    const ticket1 = await one("SELECT id FROM dbo.YeuCauHoTro WHERE orderId=@oid AND type='Complaint'", { oid: order1.id }, t);
    if (!ticket1) {
      const c = await one(`
        INSERT dbo.YeuCauHoTro(orderId, customerId, type, description, status, assignedTo, createdAt, updatedAt)
        OUTPUT INSERTED.id
        VALUES(@oid, @uid, 'Complaint', N'[KHIẾU NẠI · Thái độ KTV · Ưu tiên: High]\nKhách gọi hotline phản ánh KTV đến muộn, thái độ cáu gắt và đòi thêm tiền bồi dưỡng không đúng hóa đơn.', 'Open', @staff, DATEADD(day, -2, SYSUTCDATETIME()), DATEADD(day, -2, SYSUTCDATETIME()))
      `, { oid: order1.id, uid: kh.id, staff: cskh.id }, t);

      await q(`
        INSERT dbo.LichSuHoTro(ticketId, actorId, status, note, createdAt)
        VALUES(@id, @uid, 'Open', N'Khách hàng gọi tổng đài yêu cầu kiểm tra và xử lý thái độ của KTV.', DATEADD(day, -2, SYSUTCDATETIME()))
      `, { id: c.id, uid: kh.id }, t);

      await q(`
        INSERT dbo.LichSuHoTro(ticketId, actorId, status, note, createdAt)
        VALUES(@id, @staff, 'Open', N'[Ghi chú nội bộ] CSKH đã tiếp nhận, kiểm tra lịch sử định vị thợ đến trễ 45 phút. Đang liên hệ quản lý kỹ thuật.', DATEADD(day, -1, SYSUTCDATETIME()))
      `, { id: c.id, staff: cskh.id }, t);

      console.log('+ Đã tạo phiếu khiếu nại HT-', c.id);
    }

    // 4. Đơn hoàn thành #2: Thay block tủ lạnh / quạt tản nhiệt + Bảo hành (InProgress)
    let order2 = await one("SELECT id FROM dbo.DonHang WHERE contactPhone='0919888999'", {}, t);
    if (!order2) {
      order2 = await one(`
        INSERT dbo.DonHang(customerId, serviceId, serviceName, serviceGroup, contactName, contactPhone, address, description, status, assignedTechnicianId)
        OUTPUT INSERTED.id
        VALUES(@cid, @sid, @sname, @sgroup, N'Cô Thu Hằng', '0919888999', N'456 Hai Bà Trưng, Phường Tân Định, Quận 1', N'Tủ lạnh Hitachi không đông đá, kêu to', 'HoanThanh', @kid)
      `, {
        cid: kh.id,
        sid: service1.id,
        sname: 'Sửa tủ lạnh',
        sgroup: 'DienLanh',
        kid: ktv.id
      }, t);

      // Đề xuất vật tư có bảo hành 6 tháng
      const matQuote = await one(`
        INSERT dbo.DeXuatVatTu(orderId, revision, isCurrent, note, total, status, createdBy, decidedBy, decidedAt)
        OUTPUT INSERTED.id
        VALUES(@oid, 1, 1, N'Thay quạt tản nhiệt tủ lạnh Hitachi chính hãng', 450000, 'Approved', @kid, @cid, DATEADD(day, -12, SYSUTCDATETIME()))
      `, { oid: order2.id, kid: ktv.id, cid: kh.id }, t);

      await q(`
        INSERT dbo.ChiTietDeXuatVatTu(quoteId, name, quantity, unit, unitPrice, warrantyMonths)
        VALUES(@qid, N'Mô tơ quạt tản nhiệt Hitachi', 1, N'Cái', 450000, 6)
      `, { qid: matQuote.id }, t);

      const acc2 = await one(`
        INSERT dbo.PhieuNghiemThu(orderId, technicianId, revision, cause, solution, materialQuoteId, inspectionFee, laborFee, materialTotal, status, decidedAt)
        OUTPUT INSERTED.id
        VALUES(@oid, @kid, 1, N'Cháy cuộn dây mô tơ quạt ngăn đông', N'Thay mô tơ quạt mới và cân chỉnh cảm biến nhiệt', @qid, 50000, 200000, 450000, 'Approved', DATEADD(day, -12, SYSUTCDATETIME()))
      `, { oid: order2.id, kid: ktv.id, qid: matQuote.id }, t);

      await q(`
        INSERT dbo.ThanhToan(orderId, acceptanceId, amount, method, status, receivedBy, paidAt)
        VALUES(@oid, @accId, 700000, 'COD', 'Paid', @kid, DATEADD(day, -12, SYSUTCDATETIME()))
      `, { oid: order2.id, accId: acc2.id, kid: ktv.id }, t);

      console.log('+ Đã tạo Đơn hoàn thành #2 (có linh kiện bảo hành):', order2.id);
    }

    // Phiếu Bảo hành (InProgress)
    const ticket2 = await one("SELECT id FROM dbo.YeuCauHoTro WHERE orderId=@oid AND type='Warranty'", { oid: order2.id }, t);
    if (!ticket2) {
      const w = await one(`
        INSERT dbo.YeuCauHoTro(orderId, customerId, type, description, status, assignedTo, createdAt, updatedAt)
        OUTPUT INSERTED.id
        VALUES(@oid, @uid, 'Warranty', N'[BẢO HÀNH · Tái phát hỏng hóc · Ưu tiên: Urgent]\nQuạt tủ lạnh vừa thay 12 ngày trước bắt đầu kêu rè rè lớn và ngăn đông không đủ lạnh làm tan đá.', 'InProgress', @staff, DATEADD(day, -1, SYSUTCDATETIME()), SYSUTCDATETIME())
      `, { oid: order2.id, uid: kh.id, staff: cskh.id }, t);

      await q(`
        INSERT dbo.LichSuHoTro(ticketId, actorId, status, note, createdAt)
        VALUES(@id, @uid, 'Open', N'Khách hàng bấm yêu cầu bảo hành trên ứng dụng, chụp hình ảnh thực tế.', DATEADD(day, -1, SYSUTCDATETIME()))
      `, { id: w.id, uid: kh.id }, t);

      await q(`
        INSERT dbo.LichSuHoTro(ticketId, actorId, status, note, createdAt)
        VALUES(@id, @staff, 'InProgress', N'[Cuộc gọi] CSKH đã gọi xác nhận với khách Thu Hằng. Khách đồng ý khung giờ 14:00 chiều mai thợ qua bảo hành miễn phí linh kiện.', SYSUTCDATETIME())
      `, { id: w.id, staff: cskh.id }, t);

      console.log('+ Đã tạo phiếu bảo hành HT-', w.id);
    }

    // 5. Đơn hoàn thành #3: Đã giải quyết xong (Resolved) để test tab Đã xử lý
    let order3 = await one("SELECT id FROM dbo.DonHang WHERE contactPhone='0903111222'", {}, t);
    if (!order3) {
      order3 = await one(`
        INSERT dbo.DonHang(customerId, serviceId, serviceName, serviceGroup, contactName, contactPhone, address, description, status, assignedTechnicianId)
        OUTPUT INSERTED.id
        VALUES(@cid, @sid, @sname, @sgroup, N'Anh Trí', '0903111222', N'88 Nam Kỳ Khởi Nghĩa, Quận 1', N'Sửa rò rỉ van cấp nước máy giặt', 'HoanThanh', @kid)
      `, {
        cid: kh.id,
        sid: service2.id,
        sname: 'Sửa đường ống nước',
        sgroup: 'DienNuoc',
        kid: ktv.id
      }, t);

      const acc3 = await one(`
        INSERT dbo.PhieuNghiemThu(orderId, technicianId, revision, cause, solution, inspectionFee, laborFee, materialTotal, status, decidedAt)
        OUTPUT INSERTED.id
        VALUES(@oid, @kid, 1, N'Hỏng gioăng cao su van cấp', N'Thay gioăng cao su', 50000, 100000, 30000, 'Approved', DATEADD(day, -15, SYSUTCDATETIME()))
      `, { oid: order3.id, kid: ktv.id }, t);

      await q(`
        INSERT dbo.ThanhToan(orderId, acceptanceId, amount, method, status, receivedBy, paidAt)
        VALUES(@oid, @accId, 180000, 'COD', 'Paid', @kid, DATEADD(day, -15, SYSUTCDATETIME()))
      `, { oid: order3.id, accId: acc3.id, kid: ktv.id }, t);
    }

    const ticket3 = await one("SELECT id FROM dbo.YeuCauHoTro WHERE orderId=@oid", { oid: order3.id }, t);
    if (!ticket3) {
      const r = await one(`
        INSERT dbo.YeuCauHoTro(orderId, customerId, type, description, status, assignedTo, resolution, createdAt, updatedAt)
        OUTPUT INSERTED.id
        VALUES(@oid, @uid, 'Complaint', N'[KHIẾU NẠI · Hóa đơn & Phí · Ưu tiên: Medium]\nKhách thắc mắc về tiền công 100k ghi trên phiếu trong khi báo giá miệng lúc đầu là 80k.', 'Resolved', @staff, N'[Phương án: Hoàn tiền / Giảm giá] Đã đối chiếu ghi âm và giải thích rõ phụ phí ngoài giờ. Khách hàng đã hài lòng và đồng ý đóng khiếu nại.', DATEADD(day, -5, SYSUTCDATETIME()), DATEADD(day, -4, SYSUTCDATETIME()))
      `, { oid: order3.id, uid: kh.id, staff: cskh.id }, t);

      await q(`
        INSERT dbo.LichSuHoTro(ticketId, actorId, status, note, createdAt)
        VALUES(@id, @uid, 'Open', N'Khách gửi phản ánh qua website.', DATEADD(day, -5, SYSUTCDATETIME()))
      `, { id: r.id, uid: kh.id }, t);

      await q(`
        INSERT dbo.LichSuHoTro(ticketId, actorId, status, note, createdAt)
        VALUES(@id, @staff, 'Resolved', N'[Phương án: Hoàn tiền / Giảm giá] Đã đối chiếu ghi âm và giải thích rõ phụ phí ngoài giờ. Khách hàng đã hài lòng và đồng ý đóng khiếu nại.', DATEADD(day, -4, SYSUTCDATETIME()))
      `, { id: r.id, staff: cskh.id }, t);

      console.log('+ Đã tạo phiếu đã giải quyết HT-', r.id);
    }

    // Đánh giá 3 sao cho đơn #3
    const rev3 = await one("SELECT id FROM dbo.DanhGia WHERE orderId=@oid", { oid: order3.id }, t);
    if (!rev3) {
      await q(`
        INSERT dbo.DanhGia(orderId, customerId, technicianId, rating, comment, createdAt)
        VALUES(@oid, @uid, @kid, 3, N'Sửa được nước nhưng giải thích chi phí chưa rõ ràng từ đầu, làm khách hơi bất ngờ.', DATEADD(day, -5, SYSUTCDATETIME()))
      `, { oid: order3.id, uid: kh.id, kid: ktv.id }, t);
    }
  });

  console.log('✅ HOÀN TẤT KHỞI TẠO DỮ LIỆU TEST CSKH!');
  await close();
}

seed().catch(err => {
  console.error('Lỗi khi seed dữ liệu CSKH:', err);
  process.exit(1);
});
