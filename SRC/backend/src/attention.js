import {q,one} from './db.js';

// Only return work visible to the current user; do not infer tasks from unread messages.
export async function attentionSummary(user){
 const unread=await one('SELECT COUNT(*) n FROM dbo.ThongBao WHERE userId=@uid AND readAt IS NULL',{uid:user.id});
 let condition='';
 if(user.role==='KH')condition=`d.customerId=@uid AND (
  d.status IN('ChoDuyetSoBo','ChoNghiemThu')
  OR (d.status='DangXuLy' AND EXISTS(SELECT 1 FROM dbo.DeXuatVatTu m WHERE m.orderId=d.id AND m.status='Pending'))
  OR (d.status='HoanThanh' AND NOT EXISTS(SELECT 1 FROM dbo.ThanhToan p WHERE p.orderId=d.id)
   AND NOT EXISTS(SELECT 1 FROM dbo.YeuCauThanhToan r WHERE r.orderId=d.id AND r.isActive=1 AND r.status='PendingReview'))
 )`;
 if(user.role==='DPV')condition="d.status IN('ChoTiepNhan','ChoPhanCong')";
 if(user.role==='KTV')condition=`d.assignedTechnicianId=@uid AND (
  (d.status='ChoNhan' AND EXISTS(SELECT 1 FROM dbo.LenhDieuPhoi a WHERE a.orderId=d.id AND a.technicianId=@uid AND a.isActive=1 AND a.status='Pending' AND a.expiresAt>SYSUTCDATETIME()))
  OR d.status IN('DaTiepNhan','DangDiChuyen','DaDenNoi')
  OR (d.status='DangXuLy' AND NOT EXISTS(SELECT 1 FROM dbo.DeXuatVatTu m WHERE m.orderId=d.id AND m.status='Pending'))
  OR (d.status='HoanThanh' AND COALESCE(d.paymentMethod,'COD')='COD' AND NOT EXISTS(SELECT 1 FROM dbo.ThanhToan p WHERE p.orderId=d.id))
 )`;
 const orders=condition?await q('SELECT d.id,d.status,d.serviceName FROM dbo.DonHang d WHERE '+condition+' ORDER BY d.id DESC',{uid:user.id}):[];
 const finance=user.role==='KT'?await one(`SELECT
  (SELECT COUNT(*) FROM dbo.DoiSoat WHERE status='Pending') settlements,
  (SELECT COUNT(*) FROM dbo.YeuCauThanhToan WHERE isActive=1 AND status='PendingReview') bank,
  (SELECT COUNT(*) FROM dbo.YeuCauVi WHERE status='Pending') wallet`):{settlements:0,bank:0,wallet:0};
 const support=user.role==='CSKH'?await one("SELECT COUNT(*) n FROM dbo.YeuCauHoTro WHERE status IN('Open','InProgress') AND (assignedTo IS NULL OR assignedTo=@uid)",{uid:user.id}):{n:0};
 const applications=user.role==='ADMIN'?await one("SELECT COUNT(*) n FROM dbo.HoSoKTV WHERE status='Pending'"):{n:0};
 return {unread:Number(unread.n),orderIds:orders.map(o=>o.id),orders,finance,support:Number(support.n),applications:Number(applications.n)};
}
