import { sql, q, one, transaction, close } from '../backend/src/db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('=== KHỞI TẠO 10+ ĐƠN HÀNG VÀ DỮ LIỆU TEST TOÀN DIỆN CHO CSKH ===');
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
      console.log('✓ Tài khoản CSKH:', cskh.id);
    }

    // 2. Kỹ thuật viên
    let ktv = await one("SELECT TOP 1 k.id, n.fullName, n.phone FROM dbo.KyThuatVien k JOIN dbo.NguoiDung n ON n.id=k.id", {}, t);
    if (!ktv) {
      const u = await one("INSERT dbo.NguoiDung(fullName, phone, email, passwordHash, role, defaultAddress) OUTPUT INSERTED.id, INSERTED.fullName, INSERTED.phone VALUES(N'Trần Văn Minh', '0971000001', 'ktv.minh@homefix.local', @hash, 'KTV', N'TP.HCM')", { hash }, t);
      await q("INSERT dbo.KyThuatVien(id,skillGroup,serviceArea,availability,balance) VALUES(@id,N'DienLanh',N'TP.HCM','SanSang',1500000)", { id: u.id }, t);
      ktv = u;
    }

    // 3. Danh sách 10 khách hàng & đơn hàng kiểm thử
    const testCases = [
      {
        phone: '0901111001',
        name: 'Nguyễn Văn An',
        address: '124 Lê Lợi, Bến Nghé, Quận 1',
        serviceId: 1,
        serviceName: 'Sửa máy lạnh',
        serviceGroup: 'DienLanh',
        desc: 'Máy lạnh Daikin 2HP kêu to và không mát',
        cause: 'Hỏng tụ quạt dàn nóng',
        solution: 'Thay tụ quạt 35uF và vệ sinh dàn tản nhiệt',
        daysAgo: 3,
        laborFee: 200000,
        matName: 'Tụ quạt dàn nóng Daikin',
        matPrice: 150000,
        warrantyMonths: 3,
        rating: 1,
        ratingComment: 'Thợ đến muộn hơn 1 tiếng, ăn nói cộc lốc với khách.',
        ticketType: 'Complaint',
        ticketStatus: 'Open',
        ticketDesc: '[KHIẾU NẠI · Thái độ KTV · Ưu tiên: High]\nKhách gọi hotline bức xúc vì KTV hẹn 9h sáng nhưng 10h15 mới tới, không xin lỗi.'
      },
      {
        phone: '0901111002',
        name: 'Lê Thị Bích',
        address: '45 Hai Bà Trưng, Phường Tân Định, Quận 1',
        serviceId: 3,
        serviceName: 'Sửa tủ lạnh',
        serviceGroup: 'DienLanh',
        desc: 'Tủ lạnh Samsung Inverter báo lỗi nhấp nháy đèn, ngăn mát ấm',
        cause: 'Hỏng bo mạch điều khiển quạt',
        solution: 'Thay bo mạch điều khiển chính hãng Samsung',
        daysAgo: 10,
        laborFee: 250000,
        matName: 'Bo mạch điều khiển Samsung Inverter',
        matPrice: 850000,
        warrantyMonths: 6,
        rating: 2,
        ratingComment: 'Linh kiện thay mới mà tủ vẫn chưa lạnh sâu như trước.',
        ticketType: 'Warranty',
        ticketStatus: 'InProgress',
        ticketDesc: '[BẢO HÀNH · Tái phát hỏng hóc · Ưu tiên: High]\nTủ lạnh mới thay bo mạch 10 ngày trước lại có hiện tượng không xả đá, ngăn mát đóng tuyết.'
      },
      {
        phone: '0901111003',
        name: 'Trần Hoàng Dũng',
        address: '88 Nam Kỳ Khởi Nghĩa, Bến Thành, Quận 1',
        serviceId: 12,
        serviceName: 'Sửa ống nước tại nhà',
        serviceGroup: 'DienNuoc',
        desc: 'Ống nước âm tường phòng tắm tầng 2 bị rò rỉ ướt trần thạch cao',
        cause: 'Nứt co nối PVC phi 27 do co giãn nhiệt',
        solution: 'Đục nhẹ hộp gen, cắt và thay thế co nối chịu áp',
        daysAgo: 5,
        laborFee: 300000,
        matName: 'Bộ co lơ ống nước tiền phong phi 27',
        matPrice: 800000,
        warrantyMonths: 12,
        rating: 2,
        ratingComment: 'Báo giá vật tư hơi đắt so với giá thị trường, không đưa hóa đơn bán lẻ.',
        ticketType: 'Complaint',
        ticketStatus: 'Open',
        ticketDesc: '[KHIẾU NẠI · Hóa đơn & Phí · Ưu tiên: Medium]\nKhách phản ánh thợ tính giá vật tư 800k quá cao, nghi ngờ kê khống chi phí.'
      },
      {
        phone: '0901111004',
        name: 'Phạm Thu Thảo',
        address: '215 Điện Biên Phủ, Phường 15, Bình Thạnh',
        serviceId: 4,
        serviceName: 'Sửa máy giặt',
        serviceGroup: 'DienGiaDung',
        desc: 'Máy giặt Electrolux lồng ngang không cấp nước và rung lắc mạnh',
        cause: 'Kẹt van cấp nước điện từ và mòn thụt giảm chấn',
        solution: 'Thay cụm van cấp đôi và đôi thụt giảm xóc lồng giặt',
        daysAgo: 2,
        laborFee: 250000,
        matName: 'Đôi thụt giảm xóc máy giặt Electrolux',
        matPrice: 380000,
        warrantyMonths: 6,
        rating: null, // Đơn sạch chưa có khiếu nại để người dùng TEST TỰ TẠO KHIẾU NẠI MỚI!
        ticketType: null
      },
      {
        phone: '0901111005',
        name: 'Hoàng Quốc Bảo',
        address: '68 Nguyễn Huệ, Phường Bến Nghé, Quận 1',
        serviceId: 2,
        serviceName: 'Vệ sinh máy lạnh',
        serviceGroup: 'DienLanh',
        desc: 'Vệ sinh định kỳ 2 bộ máy lạnh phòng khách và phòng ngủ',
        cause: 'Bụi bẩn bám dầy lưới lọc và quạt lồng sóc',
        solution: 'Xịt rửa áp lực, thông ống thoát nước và xịt khử khuẩn',
        daysAgo: 7,
        laborFee: 300000,
        matName: null,
        matPrice: 0,
        warrantyMonths: 0,
        rating: null, // Đơn sạch để người dùng TEST TỰ TẠO PHIẾU BẢO HÀNH DỊCH VỤ!
        ticketType: null
      },
      {
        phone: '0901111006',
        name: 'Võ Minh Trí',
        address: '320 Cách Mạng Tháng 8, Phường 10, Quận 3',
        serviceId: 13,
        serviceName: 'Sửa máy bơm nước',
        serviceGroup: 'DienNuoc',
        desc: 'Máy bơm tăng áp Panasonic chạy liên tục không tự ngắt gây nóng máy',
        cause: 'Hỏng rơ-le áp lực điện tử và thủng bình tích áp',
        solution: 'Thay rơ-le điện tử tự ngắt và nạp lại bình tích áp',
        daysAgo: 14,
        laborFee: 200000,
        matName: 'Rơ-le điện tử thông minh chống cháy máy bơm',
        matPrice: 350000,
        warrantyMonths: 12,
        rating: 3,
        ratingComment: 'Máy bơm chạy lại được rồi nhưng lúc đóng ngắt nghe tiếng cạch khá to.',
        ticketType: 'Warranty',
        ticketStatus: 'InProgress',
        ticketDesc: '[BẢO HÀNH · Tiếng ồn bất thường · Ưu tiên: Medium]\nKhách báo rơ-le mới thay đóng ngắt kêu cạch cạch liên hồi khi mở vòi nước nhỏ.'
      },
      {
        phone: '0901111007',
        name: 'Đỗ Phương Linh',
        address: '15 Tôn Đức Thắng, Phường Bến Nghé, Quận 1',
        serviceId: 25,
        serviceName: 'Sửa lò vi sóng',
        serviceGroup: 'DienGiaDung',
        desc: 'Lò vi sóng Sharp đĩa vẫn quay nhưng không làm nóng thức ăn',
        cause: 'Chết đèn phát sóng Magnetron và nổ cầu chì cao áp',
        solution: 'Thay súng cao tần Magnetron và cầu chì 5KV',
        daysAgo: 1,
        laborFee: 180000,
        matName: 'Đèn phát sóng Magnetron Sharp chính hãng',
        matPrice: 420000,
        warrantyMonths: 6,
        rating: 1,
        ratingComment: 'Thợ sửa xong để dầu mỡ văng lung tung trên kệ bếp không lau dọn.',
        ticketType: 'Complaint',
        ticketStatus: 'Open',
        ticketDesc: '[KHIẾU NẠI · Tác phong thợ · Ưu tiên: Medium]\nKhách bức xúc phản ánh KTV sửa lò vi sóng làm rớt ốc vít và bụi bẩn bừa bãi không dọn.'
      },
      {
        phone: '0901111008',
        name: 'Vũ Đức Anh',
        address: '54 Pasteur, Phường Bến Nghé, Quận 1',
        serviceId: 20,
        serviceName: 'Bơm gas máy lạnh',
        serviceGroup: 'DienLanh',
        desc: 'Máy lạnh LG xì hết gas r410a, ống đồng bám tuyết',
        cause: 'Hở rắc-co đầu kết nối dàn lạnh',
        solution: 'Loe lại ống đồng, siết chặt rắc-co và nạp đủ áp gas',
        daysAgo: 20,
        laborFee: 200000,
        matName: 'Nạp gas R410A trọn gói 2HP',
        matPrice: 350000,
        warrantyMonths: 3,
        rating: 3,
        ratingComment: 'Đã xử lý xong khiếu nại hoàn trả 50k, CSKH hỗ trợ nhiệt tình chu đáo.',
        ticketType: 'Complaint',
        ticketStatus: 'Resolved',
        ticketDesc: '[KHIẾU NẠI · Sai lệch chi phí · Đã xử lý]\nKhách thắc mắc về đơn giá gas. CSKH đã giải thích bảng giá công khai và tặng voucher giảm giá 10%.'
      },
      {
        phone: '0901111009',
        name: 'Bùi Tuyết Mai',
        address: '92 Nguyễn Thị Minh Khai, Phường 6, Quận 3',
        serviceId: 15,
        serviceName: 'Thông nghẹt bồn rửa chén',
        serviceGroup: 'DienNuoc',
        desc: 'Chậu rửa bát trào ngược mỡ và thức ăn thừa xuống sàn nhà',
        cause: 'Đóng bánh dầu mỡ lâu ngày trong xi-phông và ống thoát',
        solution: 'Dùng dây lò xo chuyên dụng thông tắc và xả dung dịch vi sinh tan mỡ',
        daysAgo: 4,
        laborFee: 250000,
        matName: null,
        matPrice: 0,
        warrantyMonths: 0,
        rating: 2,
        ratingComment: 'Nước thoát được nhưng vẫn hơi chậm, thợ vội về sớm.',
        ticketType: 'Complaint',
        ticketStatus: 'Open',
        ticketDesc: '[KHIẾU NẠI · Chưa dứt điểm · Ưu tiên: High]\nKhách phản ánh chậu rửa chén rửa được 2 hôm lại có dấu hiệu ứ đọng nước.'
      },
      {
        phone: '0901111010',
        name: 'Ngô Thanh Tùng',
        address: '107 Trương Định, Phường 9, Quận 3',
        serviceId: 27,
        serviceName: 'Sửa máy nước nóng',
        serviceGroup: 'DienGiaDung',
        desc: 'Bình nước nóng Ariston không vào điện, nhảy aptomat chống giật ELCB',
        cause: 'Thanh đốt Magie bị ăn mòn rò điện ra vỏ bình',
        solution: 'Thay thanh đốt đồng và cọc khử cặn Magie mới',
        daysAgo: 6,
        laborFee: 200000,
        matName: 'Cụm thanh đốt bình Ariston 20L',
        matPrice: 480000,
        warrantyMonths: 12,
        rating: 4,
        ratingComment: 'Bảo hành lại rất nhanh, thợ nhiệt tình lịch sự.',
        ticketType: 'Warranty',
        ticketStatus: 'Closed',
        ticketDesc: '[BẢO HÀNH · Đã hoàn tất]\nKhách gọi kiểm tra đèn báo nhiệt. KTV đã qua cân chỉnh rơ-le nhiệt miễn phí, khách ký xác nhận hài lòng.'
      }
    ];

    console.log(`Bắt đầu tạo ${testCases.length} đơn hàng kiểm thử...`);

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];

      // Đảm bảo khách hàng tồn tại
      let customer = await one("SELECT id, fullName, phone FROM dbo.NguoiDung WHERE phone=@p", { p: tc.phone }, t);
      if (!customer) {
        customer = await one(`
          INSERT dbo.NguoiDung(fullName, phone, email, passwordHash, role, defaultAddress)
          OUTPUT INSERTED.id, INSERTED.fullName, INSERTED.phone
          VALUES(@name, @phone, @email, @hash, 'KH', @addr)
        `, {
          name: tc.name,
          phone: tc.phone,
          email: `khach.${tc.phone}@homefix.local`,
          hash,
          addr: tc.address
        }, t);
      }

      // Tạo đơn hàng hoàn thành
      let order = await one("SELECT id FROM dbo.DonHang WHERE contactPhone=@p", { p: tc.phone }, t);
      if (!order) {
        order = await one(`
          INSERT dbo.DonHang(customerId, serviceId, serviceName, serviceGroup, contactName, contactPhone, address, description, status, assignedTechnicianId, createdAt)
          OUTPUT INSERTED.id
          VALUES(@cid, @sid, @sname, @sgroup, @cname, @cphone, @addr, @desc, 'HoanThanh', @kid, DATEADD(day, -@days, SYSUTCDATETIME()))
        `, {
          cid: customer.id,
          sid: tc.serviceId,
          sname: tc.serviceName,
          sgroup: tc.serviceGroup,
          cname: tc.name,
          cphone: tc.phone,
          addr: tc.address,
          desc: tc.desc,
          kid: ktv.id,
          days: tc.daysAgo
        }, t);

        // Vật tư đề xuất nếu có
        let quoteId = null;
        if (tc.matName && tc.matPrice > 0) {
          const quote = await one(`
            INSERT dbo.DeXuatVatTu(orderId, revision, isCurrent, note, total, status, createdBy, decidedBy, decidedAt)
            OUTPUT INSERTED.id
            VALUES(@oid, 1, 1, @note, @total, 'Approved', @kid, @cid, DATEADD(day, -@days, SYSUTCDATETIME()))
          `, {
            oid: order.id,
            note: 'Vật tư thay thế: ' + tc.matName,
            total: tc.matPrice,
            kid: ktv.id,
            cid: customer.id,
            days: tc.daysAgo
          }, t);
          quoteId = quote.id;

          await q(`
            INSERT dbo.ChiTietDeXuatVatTu(quoteId, name, quantity, unit, unitPrice, warrantyMonths)
            VALUES(@qid, @name, 1, N'Cái', @price, @wm)
          `, {
            qid: quoteId,
            name: tc.matName,
            price: tc.matPrice,
            wm: tc.warrantyMonths
          }, t);
        }

        // Phiếu nghiệm thu
        const totalMat = tc.matPrice || 0;
        const inspectionFee = 50000;
        const acc = await one(`
          INSERT dbo.PhieuNghiemThu(orderId, technicianId, revision, cause, solution, materialQuoteId, inspectionFee, laborFee, materialTotal, status, decidedAt)
          OUTPUT INSERTED.id
          VALUES(@oid, @kid, 1, @cause, @solution, @qid, @insFee, @laborFee, @matTotal, 'Approved', DATEADD(day, -@days, SYSUTCDATETIME()))
        `, {
          oid: order.id,
          kid: ktv.id,
          cause: tc.cause,
          solution: tc.solution,
          qid: quoteId,
          insFee: inspectionFee,
          laborFee: tc.laborFee,
          matTotal: totalMat,
          days: tc.daysAgo
        }, t);

        // Thanh toán COD hoàn tất
        const grandTotal = inspectionFee + tc.laborFee + totalMat;
        await q(`
          INSERT dbo.ThanhToan(orderId, acceptanceId, amount, method, status, receivedBy, paidAt)
          VALUES(@oid, @accId, @amount, 'COD', 'Paid', @kid, DATEADD(day, -@days, SYSUTCDATETIME()))
        `, {
          oid: order.id,
          accId: acc.id,
          amount: grandTotal,
          kid: ktv.id,
          days: tc.daysAgo
        }, t);

        console.log(`[${i + 1}/10] Đã tạo Đơn HF-${order.id} | KH: ${tc.name} (${tc.phone}) | ${tc.serviceName}`);
      }

      // Đánh giá sao nếu có
      if (tc.rating) {
        const existingRev = await one("SELECT id FROM dbo.DanhGia WHERE orderId=@oid", { oid: order.id }, t);
        if (!existingRev) {
          await q(`
            INSERT dbo.DanhGia(orderId, customerId, technicianId, rating, comment, createdAt)
            VALUES(@oid, @cid, @kid, @rating, @comment, DATEADD(day, -@days, SYSUTCDATETIME()))
          `, {
            oid: order.id,
            cid: customer.id,
            kid: ktv.id,
            rating: tc.rating,
            comment: tc.ratingComment,
            days: Math.max(1, tc.daysAgo - 1)
          }, t);
        }
      }

      // Phiếu hỗ trợ YeuCauHoTro nếu có
      if (tc.ticketType) {
        const existingTicket = await one("SELECT id FROM dbo.YeuCauHoTro WHERE orderId=@oid AND type=@type", { oid: order.id, type: tc.ticketType }, t);
        if (!existingTicket) {
          const resText = tc.ticketStatus === 'Resolved' ? '[Phương án giải quyết] Đã liên hệ khách hàng xác minh và giải quyết thỏa đáng.' : null;
          const status = tc.ticketStatus === 'Closed' ? 'Resolved' : tc.ticketStatus;

          const tick = await one(`
            INSERT dbo.YeuCauHoTro(orderId, customerId, type, description, status, assignedTo, resolution, createdAt, updatedAt)
            OUTPUT INSERTED.id
            VALUES(@oid, @cid, @type, @desc, @status, @staff, @res, DATEADD(day, -@days, SYSUTCDATETIME()), SYSUTCDATETIME())
          `, {
            oid: order.id,
            cid: customer.id,
            type: tc.ticketType,
            desc: tc.ticketDesc,
            status,
            staff: cskh.id,
            res: resText,
            days: Math.max(1, tc.daysAgo - 1)
          }, t);

          // Nhật ký xử lý
          await q(`
            INSERT dbo.LichSuHoTro(ticketId, actorId, status, note, createdAt)
            VALUES(@tid, @cid, 'Open', N'Khách hàng tạo yêu cầu hỗ trợ qua tổng đài / ứng dụng.', DATEADD(day, -@days, SYSUTCDATETIME()))
          `, { tid: tick.id, cid: customer.id, days: Math.max(1, tc.daysAgo - 1) }, t);

          if (status !== 'Open') {
            await q(`
              INSERT dbo.LichSuHoTro(ticketId, actorId, status, note, createdAt)
              VALUES(@tid, @staff, @status, N'CSKH cập nhật tiến độ xử lý.', SYSUTCDATETIME())
            `, { tid: tick.id, staff: cskh.id, status }, t);
          }
        }
      }
    }
  });

  console.log('✅ HOÀN TẤT SEED 10 DÒNG DỮ LIỆU TEST ĐẦY ĐỦ CHO CSKH!');
  await close();
}

seed().catch(err => {
  console.error('❌ Lỗi khi seed dữ liệu:', err);
  process.exit(1);
});
