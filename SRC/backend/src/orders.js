import {Router} from 'express';
import {q,one,transaction} from './db.js';
import {z,str,id,ok,wrap,fail,roles,versionSchema,checkVersion,state,getOrder,activeTech,transition,touch,notify,audit,idempotent,page} from './common.js';
export const ordersRouter=Router();
const freshOrder=(orderId,t)=>one("SELECT d.*,CASE WHEN p.id IS NULL THEN 'Unpaid' ELSE 'Paid' END paymentStatus FROM dbo.DonHang d LEFT JOIN dbo.ThanhToan p ON p.orderId=d.id WHERE d.id=@id",{id:orderId},t);
export async function setting(t,key,fallback){return (await one('SELECT value FROM dbo.CauHinh WHERE [key]=@key',{key},t))?.value??fallback;}
export async function expireOne(t,a){
 await q("UPDATE dbo.LenhDieuPhoi SET status='Expired',isActive=0,decidedAt=SYSUTCDATETIME() WHERE id=@id",{id:a.id},t);
 const o=await one('SELECT * FROM dbo.DonHang WHERE id=@id',{id:a.orderId},t);
 if(o.status==='ChoNhan')await transition(t,o,null,'ChoPhanCong','Lệnh quá thời hạn phản hồi');
 await q("UPDATE dbo.KyThuatVien SET availability='TamBan' WHERE id=@id",{id:a.technicianId},t);
 await q('UPDATE dbo.DonHang SET assignedTechnicianId=NULL WHERE id=@id',{id:a.orderId},t);
 await notify(t,a.technicianId,a.orderId,'Lệnh nhận việc đã hết hạn','Bật sẵn sàng để nhận việc mới.');
}
export async function expireAssignments(){await transaction(null,async t=>{const rows=await q("SELECT * FROM dbo.LenhDieuPhoi WHERE isActive=1 AND status='Pending' AND expiresAt<=SYSUTCDATETIME()",{},t);for(const a of rows)await expireOne(t,a);});}
ordersRouter.get('/orders',roles('KH','KTV','DPV','CSKH','KT','ADMIN'),wrap(async(req,res)=>{
 const p=page(req);let where='1=1';const params={uid:req.user.id,offset:(p.page-1)*p.pageSize,limit:p.pageSize};
 if(req.user.role==='KH')where+=' AND d.customerId=@uid';
 if(req.user.role==='KTV')where+=" AND EXISTS(SELECT 1 FROM dbo.LenhDieuPhoi a WHERE a.orderId=d.id AND a.technicianId=@uid AND (a.isActive=1 OR a.status='Accepted'))";
 if(req.query.status){where+=' AND d.status=@status';params.status=String(req.query.status);}
 if(req.query.serviceGroup){where+=' AND d.serviceGroup=@serviceGroup';params.serviceGroup=String(req.query.serviceGroup);}
 if(req.query.from){where+=' AND d.createdAt>=@from';params.from=new Date(req.query.from);}
 if(req.query.to){where+=' AND d.createdAt<@to';params.to=new Date(req.query.to);}
 if(req.query.paymentStatus==='Paid')where+=' AND p.id IS NOT NULL';else if(req.query.paymentStatus==='Unpaid')where+=' AND p.id IS NULL';
 const total=await one(`SELECT COUNT(*) n FROM dbo.DonHang d LEFT JOIN dbo.ThanhToan p ON p.orderId=d.id WHERE ${where}`,params);
 const rows=await q(`SELECT d.*,CASE WHEN p.id IS NULL THEN 'Unpaid' ELSE 'Paid' END paymentStatus,n.fullName technicianName FROM dbo.DonHang d LEFT JOIN dbo.ThanhToan p ON p.orderId=d.id LEFT JOIN dbo.NguoiDung n ON n.id=d.assignedTechnicianId WHERE ${where} ORDER BY d.id DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,params);ok(res,rows,200,{...p,total:total.n});
}));
ordersRouter.get('/orders.csv',roles('ADMIN'),wrap(async(req,res)=>{
 let where='1=1';const params={};
 if(req.query.status){where+=' AND d.status=@status';params.status=String(req.query.status);}
 if(req.query.serviceGroup){where+=' AND d.serviceGroup=@serviceGroup';params.serviceGroup=String(req.query.serviceGroup);}
 if(req.query.from){where+=' AND d.createdAt>=@from';params.from=new Date(req.query.from);}
 if(req.query.to){where+=' AND d.createdAt<@to';params.to=new Date(req.query.to);}
 const rows=await q(`SELECT d.*,n.fullName technicianName FROM dbo.DonHang d LEFT JOIN dbo.NguoiDung n ON n.id=d.assignedTechnicianId WHERE ${where} ORDER BY d.id DESC`,params);
 const lines=['Mã đơn,Tên dịch vụ,Nhóm,Khách hàng,SĐT,Địa chỉ,Trạng thái,KTV,Ngày tạo',...rows.map(r=>[r.id,`"${r.serviceName}"`,r.serviceGroup,`"${r.contactName}"`,r.contactPhone,`"${r.address}"`,r.status,`"${r.technicianName||''}"`,new Date(r.createdAt).toISOString()].join(','))];
 res.attachment('DanhSachDonHang.csv').type('text/csv').send('\ufeff'+lines.join('\r\n'));
}));
ordersRouter.post('/orders',roles('KH'),wrap(async(req,res)=>{
 const b=z.strictObject({serviceId:z.number().int().positive(),address:str(10,500),description:str(5,2000),scheduledAt:z.iso.datetime({offset:true}).nullable().default(null),attachmentIds:z.array(z.number().int().positive()).max(5).default([])}).parse(req.body);
 const result=await transaction(req.user,t=>idempotent(t,req,b,async()=>{
  const service=await one('SELECT * FROM dbo.DichVu WHERE id=@id AND isActive=1',{id:b.serviceId},t);if(!service)fail(404,'SERVICE_UNAVAILABLE','Dịch vụ không còn được cung cấp.');
  if(b.scheduledAt){const when=new Date(b.scheduledAt);const vnHour=(when.getUTCHours()+7)%24;if(when.getTime()<Date.now()+30*60000||when.getTime()>Date.now()+30*86400000||vnHour<8||vnHour>=18||when.getUTCMinutes()%30!==0||when.getUTCSeconds()!==0||when.getUTCMilliseconds()!==0)fail(422,'INVALID_SCHEDULE','Lịch hẹn từ 08:00–17:30, cách nhau 30 phút, trước ít nhất 30 phút và trong 30 ngày.');}
  if(new Set(b.attachmentIds).size!==b.attachmentIds.length)fail(422,'DUPLICATE_ATTACHMENT','Ảnh bị lặp.');
  for(const fid of b.attachmentIds){const f=await one("SELECT * FROM dbo.TepDinhKem WHERE id=@id AND ownerId=@uid AND orderId IS NULL AND purpose='OrderFault'",{id:fid,uid:req.user.id},t);if(!f)fail(404,'ATTACHMENT_NOT_FOUND','Ảnh không hợp lệ hoặc đã dùng cho đơn khác.');}
  const cancellationFeeSnapshot=await setting(t,'cancellationFee','50000');
  const o=await one('INSERT dbo.DonHang(customerId,serviceId,serviceName,serviceGroup,contactName,contactPhone,address,description,scheduledAt,cancellationFeeSnapshot) OUTPUT INSERTED.* VALUES(@customerId,@serviceId,@serviceName,@serviceGroup,@contactName,@contactPhone,@address,@description,@scheduledAt,CAST(@cancellationFeeSnapshot AS decimal(18,2)))',{customerId:req.user.id,serviceId:b.serviceId,serviceName:service.name,serviceGroup:service.groupCode,contactName:req.user.fullName,contactPhone:req.user.phone,address:b.address,description:b.description,scheduledAt:b.scheduledAt?new Date(b.scheduledAt):null,cancellationFeeSnapshot},t);
  for(const fid of b.attachmentIds)await q('UPDATE dbo.TepDinhKem SET orderId=@oid WHERE id=@id',{oid:o.id,id:fid},t);
  await q("INSERT dbo.LichSuDonHang(orderId,toStatus,actorId,reason) VALUES(@id,'ChoTiepNhan',@uid,N'Khách hàng đặt dịch vụ')",{id:o.id,uid:req.user.id},t);await notify(t,req.user.id,o.id,'Đặt dịch vụ thành công','Điều phối viên sẽ liên hệ và gửi báo giá.');return freshOrder(o.id,t);
 }));ok(res,result.data,result.replay?200:201);
}));
ordersRouter.get('/orders/:id',wrap(async(req,res)=>{
 const oid=id(req.params.id),o=await getOrder(oid,req.user);
 const [preliminary,material,acceptance,assignment]=await Promise.all([one('SELECT * FROM dbo.BaoGiaSoBo WHERE orderId=@id',{id:oid}),one('SELECT TOP 1 * FROM dbo.DeXuatVatTu WHERE orderId=@id ORDER BY revision DESC',{id:oid}),one('SELECT TOP 1 * FROM dbo.PhieuNghiemThu WHERE orderId=@id ORDER BY revision DESC',{id:oid}),one('SELECT TOP 1 * FROM dbo.LenhDieuPhoi WHERE orderId=@id ORDER BY id DESC',{id:oid})]);
 ok(res,{...o,code:`HF-${String(o.id).padStart(6,'0')}`,currentPreliminaryQuote:preliminary??null,currentMaterialQuote:material??null,currentAcceptance:acceptance??null,currentAssignment:assignment??null});
}));
ordersRouter.get('/orders/:id/history',wrap(async(req,res)=>{const oid=id(req.params.id);await getOrder(oid,req.user);ok(res,await q('SELECT h.*,n.fullName actorName,n.role actorRole FROM dbo.LichSuDonHang h LEFT JOIN dbo.NguoiDung n ON n.id=h.actorId WHERE orderId=@id ORDER BY h.id',{id:oid}));}));
ordersRouter.patch('/orders/:id/progress',roles('KTV'),wrap(async(req,res)=>{
 const oid=id(req.params.id),b=z.strictObject({nextStatus:z.enum(['DangDiChuyen','DaDenNoi','DangXuLy']),expectedVersion:versionSchema}).parse(req.body);
 const o=await transaction(req.user,async t=>{const order=await getOrder(oid,req.user,t);await activeTech(t,order,req.user);checkVersion(order,b.expectedVersion);await transition(t,order,req.user,b.nextStatus,'Kỹ thuật viên cập nhật tiến độ',b.expectedVersion);await notify(t,order.customerId,oid,'Tiến độ đơn được cập nhật',b.nextStatus);return freshOrder(oid,t);});ok(res,o);
}));
ordersRouter.post('/orders/:id/cancel',roles('KH','DPV'),wrap(async(req,res)=>{
 const oid=id(req.params.id),b=z.strictObject({reason:str(5,1000),expectedVersion:versionSchema}).parse(req.body);
 const result=await transaction(req.user,async t=>{const o=await getOrder(oid,req.user,t);checkVersion(o,b.expectedVersion);if(['DaDenNoi','DangXuLy','ChoNghiemThu'].includes(o.status))fail(409,'SUPPORT_REQUIRED','Thợ đã đến nơi. Vui lòng liên hệ hỗ trợ để xử lý.');state(o,'ChoTiepNhan','ChoDuyetSoBo','ChoPhanCong','ChoNhan','DaTiepNhan','DangDiChuyen');
  const fee=o.status==='DangDiChuyen'?o.cancellationFeeSnapshot:'0';await transition(t,o,req.user,'Huy',b.reason,b.expectedVersion);
  await q('UPDATE dbo.DonHang SET cancelReason=@reason,cancellationFee=CAST(@fee AS decimal(18,2)),cancelledAt=SYSUTCDATETIME() WHERE id=@id',{id:oid,reason:b.reason,fee},t);
  await q("UPDATE dbo.LenhDieuPhoi SET isActive=0,reason=@reason WHERE orderId=@id AND isActive=1",{id:oid,reason:b.reason},t);
  if(o.assignedTechnicianId)await q("UPDATE dbo.KyThuatVien SET availability='TamBan' WHERE id=@id",{id:o.assignedTechnicianId},t);
  await notify(t,o.customerId,oid,'Đơn đã hủy',fee==='0'?'Không phát sinh phí.':'Phí di chuyển là khoản phải thu, chưa ghi nhận đã thanh toán.');return freshOrder(oid,t);
 });ok(res,result);
}));
ordersRouter.get('/orders/:id/cancellation',wrap(async(req,res)=>{const o=await getOrder(id(req.params.id),req.user);ok(res,o.status==='Huy'?{reason:o.cancelReason,cancelledAt:o.cancelledAt,amount:o.cancellationFee,paymentStatus:o.cancellationPaymentStatus}:null);}));
ordersRouter.post('/orders/:id/notes',roles('DPV'),wrap(async(req,res)=>{
 const oid=id(req.params.id),b=z.strictObject({text:str(1,2000),visibility:z.enum(['Customer','Internal']),expectedVersion:versionSchema}).parse(req.body);
 const note=await transaction(req.user,async t=>{const o=await getOrder(oid,req.user,t);checkVersion(o,b.expectedVersion);state(o,'ChoTiepNhan','ChoDuyetSoBo','ChoPhanCong','ChoNhan','DaTiepNhan','DangDiChuyen','DaDenNoi','DangXuLy');const n=await one('INSERT dbo.GhiChuDon(orderId,authorId,text,visibility) OUTPUT INSERTED.* VALUES(@oid,@uid,@text,@visibility)',{oid,uid:req.user.id,text:b.text,visibility:b.visibility},t);await touch(t,oid);return n;});ok(res,note,201);
}));
ordersRouter.get('/orders/:id/notes',wrap(async(req,res)=>{const oid=id(req.params.id);await getOrder(oid,req.user);const all=['DPV','CSKH'].includes(req.user.role);ok(res,await q(`SELECT g.*,n.fullName authorName FROM dbo.GhiChuDon g JOIN dbo.NguoiDung n ON n.id=g.authorId WHERE orderId=@id ${all?'':"AND visibility='Customer'"} ORDER BY g.id DESC`,{id:oid}));}));
ordersRouter.get('/technicians/me',roles('KTV'),wrap(async(req,res)=>{const k=await one('SELECT k.*,n.fullName, (SELECT AVG(CAST(rating AS decimal(5,2))) FROM dbo.DanhGia WHERE technicianId=k.id) averageRating FROM dbo.KyThuatVien k JOIN dbo.NguoiDung n ON n.id=k.id WHERE k.id=@id',{id:req.user.id});ok(res,{...k,walletEligibility:{enabled:true,minimum:await setting(null,'minimumWallet','200000')},activeAssignmentSummary:await one('SELECT * FROM dbo.LenhDieuPhoi WHERE technicianId=@id AND isActive=1',{id:req.user.id})??null});}));
ordersRouter.patch('/technicians/me/availability',roles('KTV'),wrap(async(req,res)=>{
 const b=z.strictObject({availability:z.enum(['SanSang','TamBan']),expectedVersion:versionSchema}).parse(req.body);
 const k=await transaction(req.user,async t=>{const row=await one('SELECT * FROM dbo.KyThuatVien WHERE id=@id',{id:req.user.id},t);checkVersion(row,b.expectedVersion);if(await one('SELECT id FROM dbo.LenhDieuPhoi WHERE technicianId=@id AND isActive=1',{id:row.id},t))fail(409,'ACTIVE_ASSIGNMENT','Bạn đang có lệnh hoặc ca làm việc.');if(b.availability==='SanSang'&&Number(row.balance)<Number(await setting(t,'minimumWallet','200000')))fail(409,'INSUFFICIENT_BALANCE','Ví chưa đạt số dư tối thiểu để nhận việc.');await q('UPDATE dbo.KyThuatVien SET availability=@availability WHERE id=@id',{id:row.id,availability:b.availability},t);return one('SELECT * FROM dbo.KyThuatVien WHERE id=@id',{id:row.id},t);});ok(res,k);
}));
ordersRouter.get('/technicians/available',roles('DPV'),wrap(async(req,res)=>{
 const order=await getOrder(id(req.query.orderId),req.user);const min=await setting(null,'minimumWallet','200000');
 ok(res,await q("SELECT k.id,n.fullName,k.skillGroup,k.serviceArea,k.availability,k.latitude,k.longitude,k.positionUpdatedAt FROM dbo.KyThuatVien k JOIN dbo.NguoiDung n ON n.id=k.id WHERE n.isActive=1 AND k.availability='SanSang' AND k.balance>=CAST(@min AS decimal(18,2)) AND k.skillGroup=@group AND NOT EXISTS(SELECT 1 FROM dbo.LenhDieuPhoi a WHERE a.technicianId=k.id AND a.isActive=1)",{min,group:order.serviceGroup}));
}));
ordersRouter.get('/technicians',roles('DPV'),wrap(async(req,res)=>ok(res,await q("SELECT k.id,n.fullName,n.phone,k.skillGroup,k.serviceArea,k.availability,k.balance,k.latitude,k.longitude,k.positionUpdatedAt,(SELECT AVG(CAST(rating AS decimal(5,2))) FROM dbo.DanhGia WHERE technicianId=k.id) averageRating,(SELECT COUNT(*) FROM dbo.DonHang WHERE assignedTechnicianId=k.id AND status='HoanThanh') completedOrders FROM dbo.KyThuatVien k JOIN dbo.NguoiDung n ON n.id=k.id WHERE n.isActive=1"))));
ordersRouter.post('/orders/:id/assignments',roles('DPV'),wrap(async(req,res)=>{
 const oid=id(req.params.id),b=z.strictObject({technicianId:z.number().int().positive(),expectedVersion:versionSchema}).parse(req.body);
 const a=await transaction(req.user,async t=>{const o=await getOrder(oid,req.user,t);checkVersion(o,b.expectedVersion);state(o,'ChoPhanCong');const k=await one('SELECT k.*,n.isActive FROM dbo.KyThuatVien k JOIN dbo.NguoiDung n ON n.id=k.id WHERE k.id=@id',{id:b.technicianId},t);
  if(!k?.isActive||k.availability!=='SanSang'||k.skillGroup!==o.serviceGroup||Number(k.balance)<Number(await setting(t,'minimumWallet','200000'))||await one('SELECT id FROM dbo.LenhDieuPhoi WHERE technicianId=@id AND isActive=1',{id:b.technicianId},t))fail(409,'TECHNICIAN_UNAVAILABLE','Thợ không còn sẵn sàng, chưa đủ ví hoặc sai chuyên môn.');
  // P0 serves TP.HCM. Area is checked against the address before assigning.
  const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
  if(!normalize(o.address).includes(normalize(k.serviceArea)))fail(409,'AREA_MISMATCH','Địa chỉ không nằm trong khu vực phục vụ của thợ.');
  const minutes=Number(await setting(t,'assignmentMinutes','10'));
  const a=await one("INSERT dbo.LenhDieuPhoi(orderId,technicianId,expiresAt,createdBy) OUTPUT INSERTED.* VALUES(@oid,@kid,DATEADD(minute,@minutes,SYSUTCDATETIME()),@uid)",{oid,kid:k.id,minutes,uid:req.user.id},t);await q('UPDATE dbo.DonHang SET assignedTechnicianId=@kid WHERE id=@oid',{oid,kid:k.id},t);await transition(t,o,req.user,'ChoNhan','Điều phối gửi lời mời nhận việc');await notify(t,k.id,oid,'Bạn có lệnh mới',`Vui lòng phản hồi trong ${minutes} phút.`);return a;
 });ok(res,a,201);
}));
ordersRouter.get('/technicians/me/assignments',roles('KTV'),wrap(async(req,res)=>ok(res,await q('SELECT a.*,d.serviceName,d.address,d.description FROM dbo.LenhDieuPhoi a JOIN dbo.DonHang d ON d.id=a.orderId WHERE a.technicianId=@id AND (a.isActive=1 OR a.status=@accepted) ORDER BY a.id DESC',{id:req.user.id,accepted:'Accepted'}))));
ordersRouter.get('/assignments/history',roles('DPV','ADMIN'),wrap(async(req,res)=>{
 const p=page(req);let where='1=1';const params={offset:(p.page-1)*p.pageSize,limit:p.pageSize};
 if(req.query.status){where+=' AND a.status=@status';params.status=String(req.query.status);}
 const rows=await q(`SELECT a.*,n.fullName technicianName FROM dbo.LenhDieuPhoi a LEFT JOIN dbo.NguoiDung n ON n.id=a.technicianId WHERE ${where} ORDER BY a.id DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,params);
 ok(res,rows,200,p);
}));
ordersRouter.get('/assignments/:id',roles('KTV','DPV'),wrap(async(req,res)=>{const a=await one('SELECT * FROM dbo.LenhDieuPhoi WHERE id=@id',{id:id(req.params.id)});if(!a||(req.user.role==='KTV'&&a.technicianId!==req.user.id))fail(404,'NOT_FOUND','Không tìm thấy lệnh.');ok(res,a);}));
ordersRouter.get('/orders/:id/assignments',roles('KTV','DPV'),wrap(async(req,res)=>{const oid=id(req.params.id);await getOrder(oid,req.user);ok(res,await q(`SELECT * FROM dbo.LenhDieuPhoi WHERE orderId=@id ${req.user.role==='KTV'?'AND technicianId=@uid':''} ORDER BY id DESC`,{id:oid,uid:req.user.id}));}));
ordersRouter.post('/assignments/:id/decision',roles('KTV'),wrap(async(req,res)=>{
 const aid=id(req.params.id),b=z.strictObject({decision:z.enum(['Accepted','Rejected']),reason:str(1,1000).optional(),expectedVersion:versionSchema}).parse(req.body);if(b.decision==='Rejected'&&!b.reason)fail(422,'REASON_REQUIRED','Cần lý do từ chối.');
 const result=await transaction(req.user,async t=>{const a=await one('SELECT * FROM dbo.LenhDieuPhoi WHERE id=@id',{id:aid},t);if(!a||a.technicianId!==req.user.id)fail(404,'NOT_FOUND','Không tìm thấy lệnh.');checkVersion(a,b.expectedVersion);state(a,'Pending');if(!a.isActive)fail(409,'ASSIGNMENT_CLOSED','Lệnh đã đóng.');if(new Date(a.expiresAt)<=new Date()){await expireOne(t,a);return {expired:true};}
  const o=await getOrder(a.orderId,req.user,t);state(o,'ChoNhan');const k=await one('SELECT * FROM dbo.KyThuatVien WHERE id=@id',{id:req.user.id},t);
  if(b.decision==='Accepted'&&Number(k.balance)<Number(await setting(t,'minimumWallet','200000')))fail(409,'INSUFFICIENT_BALANCE','Số dư chưa đạt ngưỡng nhận việc.');
  await q('UPDATE dbo.LenhDieuPhoi SET status=@decision,isActive=@active,reason=@reason,decidedAt=SYSUTCDATETIME() WHERE id=@id',{id:aid,decision:b.decision,active:b.decision==='Accepted',reason:b.reason},t);
  await q('UPDATE dbo.KyThuatVien SET availability=@a WHERE id=@id',{id:req.user.id,a:b.decision==='Accepted'?'DangBan':'TamBan'},t);
  if(b.decision==='Rejected')await q('UPDATE dbo.DonHang SET assignedTechnicianId=NULL WHERE id=@id',{id:o.id},t);
  await transition(t,o,req.user,b.decision==='Accepted'?'DaTiepNhan':'ChoPhanCong',b.reason||'Kỹ thuật viên đã nhận việc');return one('SELECT * FROM dbo.LenhDieuPhoi WHERE id=@id',{id:aid},t);
 });if(result.expired)fail(409,'ASSIGNMENT_EXPIRED','Lệnh đã hết hạn và được trả lại điều phối.');ok(res,result);
}));
ordersRouter.patch('/technicians/me/location',roles('KTV'),wrap(async(req,res)=>{const b=z.strictObject({latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),accuracyMeters:z.number().min(0).max(100000)}).parse(req.body);await transaction(req.user,t=>q('UPDATE dbo.KyThuatVien SET latitude=@latitude,longitude=@longitude,accuracyMeters=@accuracyMeters,positionUpdatedAt=SYSUTCDATETIME() WHERE id=@id',{...b,id:req.user.id},t));ok(res,{updated:true});}));
ordersRouter.get('/orders/:id/technician-location',roles('KH','DPV'),wrap(async(req,res)=>{const o=await getOrder(id(req.params.id),req.user);ok(res,!o.assignedTechnicianId||['HoanThanh','Huy'].includes(o.status)?null:await one('SELECT latitude,longitude,accuracyMeters,positionUpdatedAt FROM dbo.KyThuatVien WHERE id=@id',{id:o.assignedTechnicianId}));}));
