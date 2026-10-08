import {Router} from 'express';
import {q,one,transaction} from './db.js';
import {z,str,id,ok,wrap,fail,roles,versionSchema,money,decisionSchema,checkVersion,state,getOrder,activeTech,transition,touch,notify} from './common.js';
import {setting} from './orders.js';
import {selectPayment} from './payments.js';
export const quotesRouter=Router();
const fresh=(table,rid,t)=>one(`SELECT * FROM dbo.${table} WHERE id=@id`,{id:rid},t);
for(const [route,table] of [['preliminary-quotes','BaoGiaSoBo'],['material-quotes','DeXuatVatTu'],['acceptances','PhieuNghiemThu']]){
 const decorate=async row=>{if(table==='DeXuatVatTu')row.items=await q('SELECT * FROM dbo.ChiTietDeXuatVatTu WHERE quoteId=@id',{id:row.id});if(table==='PhieuNghiemThu')row.photos=await q("SELECT id,purpose,originalName FROM dbo.TepDinhKem WHERE acceptanceId=@id AND purpose='AcceptancePhoto'",{id:row.id});return row;};
 quotesRouter.get(`/orders/:id/${route}`,wrap(async(req,res)=>{const oid=id(req.params.id);await getOrder(oid,req.user);const rows=await q(`SELECT * FROM dbo.${table} WHERE orderId=@id ORDER BY id DESC`,{id:oid});ok(res,await Promise.all(rows.map(decorate)));}));
 quotesRouter.get(`/orders/:id/${route}/:recordId`,wrap(async(req,res)=>{const oid=id(req.params.id);await getOrder(oid,req.user);const row=await one(`SELECT * FROM dbo.${table} WHERE orderId=@oid AND id=@id`,{oid,id:id(req.params.recordId)});if(!row)fail(404,'NOT_FOUND','Không tìm thấy phiếu.');ok(res,await decorate(row));}));
}
quotesRouter.post('/orders/:id/preliminary-quotes',roles('DPV'),wrap(async(req,res)=>{
 const oid=id(req.params.id),b=z.strictObject({diagnosis:str(5,2000),expectedVersion:versionSchema}).parse(req.body);
 const quote=await transaction(req.user,async t=>{const o=await getOrder(oid,req.user,t);checkVersion(o,b.expectedVersion);state(o,'ChoTiepNhan');const quote=await one("INSERT dbo.BaoGiaSoBo(orderId,diagnosis,inspectionFee,laborFee,commissionRatePercent,createdBy) OUTPUT INSERTED.* SELECT @oid,@diagnosis,inspectionFee,laborFee,commissionRatePercent,@uid FROM dbo.DichVu WHERE id=@serviceId",{oid,diagnosis:b.diagnosis,uid:req.user.id,serviceId:o.serviceId},t);await transition(t,o,req.user,'ChoDuyetSoBo','Đã gửi báo giá sơ bộ');await notify(t,o.customerId,oid,'Báo giá sơ bộ cần xác nhận','Vui lòng xem chi tiết trước khi đồng ý.');return quote;});ok(res,quote,201);
}));
quotesRouter.post('/orders/:id/preliminary-quotes/:recordId/decision',roles('KH'),wrap(async(req,res)=>{
 const oid=id(req.params.id),rid=id(req.params.recordId),b=decisionSchema.parse(req.body);
 const quote=await transaction(req.user,async t=>{const o=await getOrder(oid,req.user,t);const current=await one('SELECT * FROM dbo.BaoGiaSoBo WHERE orderId=@oid AND id=@id',{oid,id:rid},t);checkVersion(current,b.expectedVersion);state(current,'Pending');state(o,'ChoDuyetSoBo');await q('UPDATE dbo.BaoGiaSoBo SET status=@decision,reason=@reason,decidedBy=@uid,decidedAt=SYSUTCDATETIME() WHERE id=@id',{id:rid,uid:req.user.id,decision:b.decision,reason:b.reason},t);await transition(t,o,req.user,b.decision==='Approved'?'ChoPhanCong':'Huy',b.reason||'Khách duyệt báo giá sơ bộ');if(b.decision==='Rejected')await q('UPDATE dbo.ChiTietDonHang SET cancelReason=@reason,cancelledAt=SYSUTCDATETIME() WHERE id=@id',{id:oid,reason:b.reason},t);return fresh('BaoGiaSoBo',rid,t);});ok(res,quote);
}));
const itemSchema=z.strictObject({name:str(1,200),quantity:z.string().regex(/^\d{1,3}(\.\d{1,2})?$/).refine(s=>Number(s)>0&&Number(s)<=999.99),unitPrice:money,unit:str(1,30),warrantyMonths:z.number().int().min(0).max(60)});
quotesRouter.post('/orders/:id/material-quotes',roles('KTV'),wrap(async(req,res)=>{
 const oid=id(req.params.id),b=z.strictObject({items:z.array(itemSchema).min(1).max(20),note:str(0,1000).optional(),customerAgreed:z.literal(true),expectedVersion:versionSchema}).parse(req.body);
 const quote=await transaction(req.user,async t=>{const o=await getOrder(oid,req.user,t);await activeTech(t,o,req.user);checkVersion(o,b.expectedVersion);state(o,'DangXuLy');await q('UPDATE dbo.DeXuatVatTu SET isCurrent=0 WHERE orderId=@id',{id:oid},t);const quote=await one('INSERT dbo.DeXuatVatTu(orderId,revision,note,createdBy,status,decidedBy,decidedAt,CachXacNhan) OUTPUT INSERTED.* SELECT @oid,COALESCE(MAX(revision),0)+1,@note,@uid,\'Approved\',@uid,SYSUTCDATETIME(),\'TrucTiep\' FROM dbo.DeXuatVatTu WHERE orderId=@oid',{oid,note:b.note,uid:req.user.id},t);
  for(const item of b.items)await q('INSERT dbo.ChiTietDeXuatVatTu(quoteId,name,quantity,unitPrice,unit,warrantyMonths) VALUES(@qid,@name,CAST(@quantity AS decimal(10,2)),CAST(@unitPrice AS decimal(18,2)),@unit,@warrantyMonths)',{qid:quote.id,...item},t);
  await q('UPDATE dbo.DeXuatVatTu SET total=(SELECT SUM(lineTotal) FROM dbo.ChiTietDeXuatVatTu WHERE quoteId=@id) WHERE id=@id',{id:quote.id},t);await touch(t,oid);await notify(t,o.customerId,oid,'Đã ghi nhận vật tư tại hiện trường','Kỹ thuật viên ghi nhận bạn đã đồng ý trực tiếp. Xem bảng kê trong đơn và kiểm tra khi nghiệm thu.');return {...await fresh('DeXuatVatTu',quote.id,t),items:await q('SELECT * FROM dbo.ChiTietDeXuatVatTu WHERE quoteId=@id',{id:quote.id},t)};
 });ok(res,quote,201);
}));
// Legacy clients must not approve materials online under the onsite workflow.
quotesRouter.post('/orders/:id/material-quotes/:recordId/decision',roles('KH'),wrap(async(req,res)=>{
 await getOrder(id(req.params.id),req.user);
 fail(410,'ONSITE_CONSENT_REQUIRED','Vật tư được trao đổi trực tiếp; kỹ thuật viên ghi nhận vào bảng kê.');
}));
quotesRouter.post('/orders/:id/acceptances',roles('KTV'),wrap(async(req,res)=>{
 const oid=id(req.params.id),b=z.strictObject({cause:str(5,2000),solution:str(5,2000),photoIds:z.array(z.number().int().positive()).min(1).max(5),signatureId:z.number().int().positive().optional(),proposedPaymentMethod:z.enum(['COD','BANK']).optional(),expectedVersion:versionSchema}).parse(req.body);
 const result=await transaction(req.user,async t=>{const o=await getOrder(oid,req.user,t);await activeTech(t,o,req.user);checkVersion(o,b.expectedVersion);state(o,'DangXuLy');if(new Set(b.photoIds).size!==b.photoIds.length)fail(422,'DUPLICATE_ATTACHMENT','Ảnh bị lặp.');if(await one("SELECT id FROM dbo.DeXuatVatTu WHERE orderId=@id AND status='Pending' AND isCurrent=1",{id:oid},t))fail(409,'MATERIAL_RECORD_REQUIRED','Kỹ thuật viên cần cập nhật bảng kê cũ sau khi trao đổi trực tiếp với khách.');
  for(const fid of b.photoIds)if(!await one("SELECT id FROM dbo.TepDinhKem WHERE id=@id AND ownerId=@uid AND orderId=@oid AND purpose='AcceptancePhoto' AND acceptanceId IS NULL",{id:fid,uid:req.user.id,oid},t))fail(404,'ATTACHMENT_NOT_FOUND','Ảnh nghiệm thu không đúng quyền, đơn hoặc đã dùng.');
  if(b.signatureId&&!await one("SELECT id FROM dbo.TepDinhKem WHERE id=@id AND ownerId=@uid AND orderId=@oid AND purpose='CustomerSignature' AND acceptanceId IS NULL",{id:b.signatureId,uid:req.user.id,oid},t))fail(404,'ATTACHMENT_NOT_FOUND','Chữ ký hiện trường không hợp lệ hoặc đã dùng.');
  const preliminary=await one("SELECT * FROM dbo.BaoGiaSoBo WHERE orderId=@id AND status='Approved'",{id:oid},t);if(!preliminary)fail(409,'QUOTE_NOT_APPROVED','Chưa có báo giá được duyệt.');const material=await one("SELECT * FROM dbo.DeXuatVatTu WHERE orderId=@id AND status='Approved' AND isCurrent=1",{id:oid},t);
  const acceptance=await one('INSERT dbo.PhieuNghiemThu(orderId,technicianId,revision,cause,solution,materialQuoteId,inspectionFee,laborFee,materialTotal) OUTPUT INSERTED.* SELECT @oid,@uid,COALESCE(MAX(revision),0)+1,@cause,@solution,@mid,CAST(@inspection AS decimal(18,2)),CAST(@labor AS decimal(18,2)),CAST(@material AS decimal(18,2)) FROM dbo.PhieuNghiemThu WHERE orderId=@oid',{oid,uid:req.user.id,cause:b.cause,solution:b.solution,mid:material?.id,inspection:String(preliminary.inspectionFee),labor:String(preliminary.laborFee),material:String(material?.total??0)},t);
  await q('UPDATE dbo.PhieuNghiemThu SET signatureId=@signature,proposedPaymentMethod=@method WHERE id=@id',{id:acceptance.id,signature:b.signatureId,method:b.proposedPaymentMethod},t);
  if(b.signatureId)await q('UPDATE dbo.TepDinhKem SET acceptanceId=@aid WHERE id=@id',{aid:acceptance.id,id:b.signatureId},t);
  for(const fid of b.photoIds)await q('UPDATE dbo.TepDinhKem SET acceptanceId=@aid WHERE id=@id',{aid:acceptance.id,id:fid},t);await transition(t,o,req.user,'ChoNghiemThu','Thợ gửi phiếu nghiệm thu');await notify(t,o.customerId,oid,'Vui lòng xác nhận nghiệm thu','Kiểm tra thiết bị, ảnh, chữ ký và tổng tiền trước khi xác nhận.');return fresh('PhieuNghiemThu',acceptance.id,t);
 });ok(res,result,201);
}));
quotesRouter.post('/orders/:id/acceptances/:recordId/decision',roles('KH'),wrap(async(req,res)=>{
 const oid=id(req.params.id),rid=id(req.params.recordId),b=decisionSchema.safeExtend({paymentMethod:z.enum(['COD','BANK']).optional(),bankAccountId:z.number().int().positive().optional()}).parse(req.body);
 const result=await transaction(req.user,async t=>{const o=await getOrder(oid,req.user,t);state(o,'ChoNghiemThu');const current=await one('SELECT * FROM dbo.PhieuNghiemThu WHERE orderId=@oid AND id=@id',{oid,id:rid},t);checkVersion(current,b.expectedVersion);state(current,'Pending');
  if(b.decision==='Approved'){
   if(await setting(t,'signatureRequired','false')==='true'&&!b.signatureId)fail(422,'SIGNATURE_REQUIRED','Vui lòng bổ sung chữ ký.');
   if(b.signatureId&&!await one("SELECT id FROM dbo.TepDinhKem WHERE id=@id AND orderId=@oid AND purpose='CustomerSignature' AND (ownerId=@uid OR (ownerId=@techId AND id=@capturedId AND acceptanceId=@acceptanceId))",{id:b.signatureId,uid:req.user.id,oid,techId:current.technicianId,capturedId:current.signatureId,acceptanceId:current.id},t))fail(404,'ATTACHMENT_NOT_FOUND','Chữ ký không hợp lệ.');
  }
  await q('UPDATE dbo.PhieuNghiemThu SET status=@decision,reason=@reason,signatureId=@signature,decidedBy=@uid,decidedAt=SYSUTCDATETIME() WHERE id=@id',{id:rid,decision:b.decision,reason:b.reason,signature:b.signatureId??current.signatureId,uid:req.user.id},t);
  if(b.decision==='Approved')await selectPayment(t,o,current,b.paymentMethod||'COD',b.bankAccountId,req.user);
  await transition(t,o,req.user,b.decision==='Approved'?'HoanThanh':'DangXuLy',b.reason||'Khách xác nhận nghiệm thu');
  if(b.decision==='Approved'){await q('UPDATE dbo.LenhDieuPhoi SET isActive=0 WHERE orderId=@id AND isActive=1',{id:oid},t);await q("UPDATE dbo.KyThuatVien SET availability='TamBan' WHERE id=@id",{id:current.technicianId},t);}
  await notify(t,current.technicianId,oid,b.decision==='Approved'?'Khách đã nghiệm thu':'Khách yêu cầu xử lý lại',b.reason||(b.paymentMethod==='BANK'?'Khách chuyển khoản về HomeFix. Không thu thêm tiền mặt.':'Thu tiền mặt và xác nhận sau khi thực nhận.'));return fresh('PhieuNghiemThu',rid,t);
 });ok(res,result);
}));
