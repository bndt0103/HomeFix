import { sql, q, one, transaction, close } from '../backend/src/db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('--- Đang khởi tạo dữ liệu mẫu cho Điều Phối Viên (DPV) ---');
  const hash = await bcrypt.hash('HomeFix@123', 12);

  await transaction(null, async t => {
    // 1. Đảm bảo có tài khoản DPV
    let dpv = await one("SELECT id FROM dbo.NguoiDung WHERE role='DPV'", {}, t);
    if (!dpv) {
      dpv = await one("INSERT dbo.NguoiDung(fullName,phone,email,passwordHash,role,defaultAddress) OUTPUT INSERTED.id VALUES(N'Điều phối Linh','0909000001','dpv@homefix.local',@hash,'DPV',N'Trụ sở HomeFix, Q1, TP.HCM')", { hash }, t);
      console.log('Đã tạo DPV:', dpv.id);
    }

    // 2. Đảm bảo có khách hàng
    let kh = await one("SELECT id, fullName, phone, defaultAddress FROM dbo.NguoiDung WHERE role='KH'", {}, t);
    if (!kh) {
      kh = await one("INSERT dbo.NguoiDung(fullName,phone,email,passwordHash,role,defaultAddress) OUTPUT INSERTED.id, INSERTED.fullName, INSERTED.phone, INSERTED.defaultAddress VALUES(N'Nguyễn Thị Mai','0918000001','khachhang@homefix.local',@hash,'KH',N'123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM')", { hash }, t);
    }

    // 3. Đảm bảo có danh sách KTV đa dạng chuyên môn, trạng thái và tọa độ TP.HCM
    const techs = [
      { name: 'Trần Văn Minh', phone: '0971000001', email: 'ktv.minh@homefix.local', group: 'DienLanh', status: 'SanSang', area: 'Quận 1, Quận 3, TP.HCM', lat: 10.7769, lng: 106.7009 },
      { name: 'Lê Hoàng Nam', phone: '0971000002', email: 'ktv.nam@homefix.local', group: 'DienLanh', status: 'DangBan', area: 'Quận 5, Quận 10, TP.HCM', lat: 10.7554, lng: 106.6672 },
      { name: 'Phạm Quốc Tuấn', phone: '0971000003', email: 'ktv.tuan@homefix.local', group: 'DienNuoc', status: 'SanSang', area: 'Quận 7, Quận 4, TP.HCM', lat: 10.7329, lng: 106.7188 },
      { name: 'Nguyễn Thành Đạt', phone: '0971000004', email: 'ktv.dat@homefix.local', group: 'DienNuoc', status: 'TamBan', area: 'Bình Thạnh, Gò Vấp, TP.HCM', lat: 10.8030, lng: 106.6990 },
      { name: 'Vũ Đức Thịnh', phone: '0971000005', email: 'ktv.thinh@homefix.local', group: 'DienGiaDung', status: 'SanSang', area: 'TP. Thủ Đức, TP.HCM', lat: 10.8499, lng: 106.7717 },
      { name: 'Đỗ Hữu Hùng', phone: '0971000006', email: 'ktv.hung@homefix.local', group: 'VeSinh', status: 'SanSang', area: 'TP. Thủ Đức, TP.HCM', lat: 10.8499, lng: 106.7717 },
    ];

    const techIds = [];
    for (const item of techs) {
      let u = await one('SELECT id FROM dbo.NguoiDung WHERE email=@email OR phone=@phone', { email: item.email, phone: item.phone }, t);
      if (!u) {
        u = await one('INSERT dbo.NguoiDung(fullName,phone,email,passwordHash,role,defaultAddress) OUTPUT INSERTED.id VALUES(@name,@phone,@email,@hash,\'KTV\',N\'TP.HCM\')', { name: item.name, phone: item.phone, email: item.email, hash }, t);
        await q("INSERT dbo.KyThuatVien(id,skillGroup,serviceArea,availability,balance,latitude,longitude,positionUpdatedAt) VALUES(@id,@group,@area,@status,1500000,@lat,@lng,SYSUTCDATETIME())", { id: u.id, group: item.group, area: item.area, status: item.status, lat: item.lat, lng: item.lng }, t);
        await q("INSERT dbo.GiaoDichVi(technicianId,type,amount,referenceType,referenceId,note) VALUES(@id,'Opening',1500000,'Opening',@id,N'Số dư ban đầu')", { id: u.id }, t);
      } else {
        await q("UPDATE dbo.KyThuatVien SET skillGroup=@group, serviceArea=@area, availability=@status, latitude=@lat, longitude=@lng, positionUpdatedAt=SYSUTCDATETIME(), balance=CASE WHEN balance<500000 THEN 1500000 ELSE balance END WHERE id=@id", { id: u.id, group: item.group, area: item.area, status: item.status, lat: item.lat, lng: item.lng }, t);
      }
      techIds.push({ id: u.id, ...item });
    }
    console.log(`Đã sẵn sàng ${techIds.length} kỹ thuật viên kèm tọa độ thực.`);

    // 4. Lấy các dịch vụ mẫu
    const dienLanhService = await one("SELECT TOP 1 * FROM dbo.DichVu WHERE groupCode='DienLanh' AND isActive=1", {}, t) || { id: 1, name: 'Sửa máy lạnh', groupCode: 'DienLanh' };
    const dienNuocService = await one("SELECT TOP 1 * FROM dbo.DichVu WHERE groupCode='DienNuoc' AND isActive=1", {}, t) || { id: 2, name: 'Sửa đường ống nước', groupCode: 'DienNuoc' };
    const dienGiaDungService = await one("SELECT TOP 1 * FROM dbo.DichVu WHERE groupCode='DienGiaDung' AND isActive=1", {}, t) || { id: 3, name: 'Sửa quạt trần', groupCode: 'DienGiaDung' };

    // 5. Thêm các đơn "Chờ tiếp nhận" (ChoTiepNhan)
    const waitingOrders = [
      {
        service: dienLanhService,
        name: 'Chị Lan',
        phone: '0912111222',
        address: '45 Lê Duẩn, Bến Nghé, Quận 1, TP.HCM',
        desc: 'Máy lạnh Panasonic Inverter chớp đèn đỏ liên tục, không phả hơi lạnh.',
      },
      {
        service: dienNuocService,
        name: 'Anh Tùng',
        phone: '0988333444',
        address: '280 Nguyễn Đình Chiểu, Phường 4, Quận 3, TP.HCM',
        desc: 'Bồn cầu bị rò rỉ nước liên tục vào ban đêm, áp lực nước yếu.',
      },
    ];

    for (const o of waitingOrders) {
      const exists = await one('SELECT id FROM dbo.DonHang WHERE contactPhone=@phone AND status=\'ChoTiepNhan\'', { phone: o.phone }, t);
      if (!exists) {
        await q(`INSERT dbo.DonHang(customerId,serviceId,serviceName,serviceGroup,contactName,contactPhone,address,description,status,scheduledAt)
                 VALUES(@cid,@sid,@sname,@sgroup,@name,@phone,@address,@desc,'ChoTiepNhan',DATEADD(hour,4,SYSUTCDATETIME()))`,
          { cid: kh.id, sid: o.service.id, sname: o.service.name, sgroup: o.service.groupCode, name: o.name, phone: o.phone, address: o.address, desc: o.desc }, t);
        console.log(`+ Đã tạo đơn Chờ Tiếp Nhận: ${o.service.name} (${o.name})`);
      }
    }

    // 6. Thêm các đơn "Chờ phân công" (ChoPhanCong)
    const pendingOrders = [
      {
        service: dienLanhService,
        name: 'Bác Hùng',
        phone: '0903555666',
        address: '88 Pastuer, Phường Bến Nghé, Quận 1, TP.HCM',
        desc: 'Máy lạnh Daikin 1.5HP chảy nước ướt sàn nhà, cần thợ kiểm tra xử lý gấp.',
        inspectionFee: 50000,
        laborFee: 150000,
      },
      {
        service: dienNuocService,
        name: 'Cô Mai',
        phone: '0919777888',
        address: '15 Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP.HCM',
        desc: 'Vòi sen tắm đứng gãy ren, rò rỉ ngập sàn phòng tắm.',
        inspectionFee: 50000,
        laborFee: 120000,
      },
      {
        service: dienGiaDungService,
        name: 'Anh Khoa',
        phone: '0933999000',
        address: '102 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP.HCM',
        desc: 'Bếp từ đôi không nhận nồi, kêu tít tít rồi tự ngắt điện.',
        inspectionFee: 50000,
        laborFee: 180000,
      }
    ];

    for (const p of pendingOrders) {
      let ord = await one('SELECT id FROM dbo.DonHang WHERE contactPhone=@phone AND status=\'ChoPhanCong\'', { phone: p.phone }, t);
      if (!ord) {
        ord = await one(`INSERT dbo.DonHang(customerId,serviceId,serviceName,serviceGroup,contactName,contactPhone,address,description,status,scheduledAt)
                         OUTPUT INSERTED.id
                         VALUES(@cid,@sid,@sname,@sgroup,@name,@phone,@address,@desc,'ChoPhanCong',DATEADD(day,1,SYSUTCDATETIME()))`,
          { cid: kh.id, sid: p.service.id, sname: p.service.name, sgroup: p.service.groupCode, name: p.name, phone: p.phone, address: p.address, desc: p.desc }, t);

        await q(`INSERT dbo.BaoGiaSoBo(orderId,diagnosis,inspectionFee,laborFee,commissionRatePercent,status,createdBy,decidedBy,decidedAt)
                 VALUES(@oid,N'Kiểm tra và xử lý theo quy trình kỹ thuật chuẩn',@ins,@lab,15,'Approved',@dpvId,@cid,SYSUTCDATETIME())`,
          { oid: ord.id, ins: p.inspectionFee, lab: p.laborFee, dpvId: dpv.id, cid: kh.id }, t);

        console.log(`+ Đã tạo đơn Chờ Phân Công: ${p.service.name} (ID: ${ord.id} - ${p.name})`);
      }
    }

    // 7. Tạo 1 đơn "Đang di chuyển" (DangDiChuyen) để test phí hủy bồi hoàn di chuyển 50.000đ
    const movingTech = techIds.find(t => t.group === 'DienLanh') || techIds[0];
    let movingOrder = await one("SELECT id FROM dbo.DonHang WHERE status='DangDiChuyen'", {}, t);
    if (!movingOrder) {
      movingOrder = await one(`INSERT dbo.DonHang(customerId,serviceId,serviceName,serviceGroup,contactName,contactPhone,address,description,status,scheduledAt,assignedTechnicianId,cancellationFeeSnapshot)
                               OUTPUT INSERTED.id
                               VALUES(@cid,@sid,@sname,@sgroup,N'Anh Hoàng','0944111333',N'55 Nguyễn Huệ, Quận 1, TP.HCM',N'Sửa máy lạnh kêu rè rè','DangDiChuyen',SYSUTCDATETIME(),@kid,50000)`,
        { cid: kh.id, sid: dienLanhService.id, sname: dienLanhService.name, sgroup: dienLanhService.groupCode, kid: movingTech.id }, t);
      console.log(`+ Đã tạo đơn Đang Di Chuyển (test phí hủy 50k): ID ${movingOrder.id}`);
    }

    // 8. Tạo lịch sử lệnh điều phối (LenhDieuPhoi) với các trạng thái khác nhau
    const sampleHistoryOrders = await q("SELECT TOP 4 id, serviceGroup FROM dbo.DonHang ORDER BY id ASC", {}, t);
    if (sampleHistoryOrders.length && techIds.length) {
      const historyDefs = [
        { status: 'Accepted', reason: 'Kỹ thuật viên đã nhận việc thành công' },
        { status: 'Rejected', reason: 'KTV bận ca đột xuất tại khu vực khác' },
        { status: 'Expired', reason: 'Quá thời hạn 10 phút phản hồi lệnh' },
        { status: 'Rejected', reason: 'Kẹt xe giờ cao điểm không thể đến đúng hẹn' },
      ];

      for (let i = 0; i < Math.min(sampleHistoryOrders.length, historyDefs.length); i++) {
        const order = sampleHistoryOrders[i];
        const tech = techIds[i % techIds.length];
        const def = historyDefs[i];

        const existingCmd = await one("SELECT id FROM dbo.LenhDieuPhoi WHERE orderId=@oid AND technicianId=@tid AND status=@st", { oid: order.id, tid: tech.id, st: def.status }, t);
        if (!existingCmd) {
          await q(`INSERT dbo.LenhDieuPhoi(orderId,technicianId,status,isActive,expiresAt,createdBy,reason,createdAt,decidedAt)
                   VALUES(@oid,@tid,@st,0,DATEADD(minute,-10,SYSUTCDATETIME()),@dpvId,@reason,DATEADD(hour,-(@i+1),SYSUTCDATETIME()),DATEADD(hour,-@i,SYSUTCDATETIME()))`,
            { oid: order.id, tid: tech.id, st: def.status, dpvId: dpv.id, reason: def.reason, i }, t);
          console.log(`+ Đã tạo Lịch sử lệnh: LDP cho Đơn #${order.id} - KTV ${tech.name} (${def.status})`);
        }
      }
    }
  });

  await close();
  console.log('--- KHỞI TẠO DỮ LIỆU TEST ĐIỀU PHỐI HOÀN TẤT! ---');
}

seed().catch(err => {
  console.error('Lỗi khi nạp dữ liệu mẫu:', err);
  process.exit(1);
});
