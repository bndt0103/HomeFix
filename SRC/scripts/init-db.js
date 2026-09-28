import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const env=path.join(root,'backend/.env');if(!fs.existsSync(env)){const template=fs.readFileSync(env+'.example','utf8').replace('replace-with-a-random-value-at-least-32-characters',crypto.randomBytes(48).toString('base64url'));fs.writeFileSync(env,template);}
const {config,dbConfig}=await import('../backend/src/config.js');const {sql,q,one,transaction,close}=await import('../backend/src/db.js');
const bcrypt=(await import('bcryptjs')).default;
if(!/^[A-Za-z][A-Za-z0-9_]{0,60}$/.test(config.database))throw new Error('DB_NAME không hợp lệ.');
const master=await new sql.ConnectionPool(dbConfig('master')).connect();
const exists=await one('SELECT database_id FROM sys.databases WHERE name=@name',{name:config.database},master);
if(!exists)await master.request().query(`CREATE DATABASE [${config.database}]`);await master.close();
const v=await one("SELECT OBJECT_ID('dbo.SchemaVersion') AS id");
if(!v.id){
 const existing=await one('SELECT COUNT(*) n FROM sys.tables');if(existing.n)throw new Error('DB đã có bảng khác. Chọn DB_NAME trống để bảo vệ dữ liệu.');
 const text=fs.readFileSync(path.join(root,'database/001_schema.sql'),'utf8');
 for(const batch of text.split(/^GO\s*$/m).filter(x=>x.trim()))await q(batch);
}
for(const filename of ['002_procedures_triggers.sql','003_cancellation_snapshot.sql','004_auth_otp.sql','005_bank_payments.sql'])
 for(const batch of fs.readFileSync(path.join(root,'database',filename),'utf8').split(/^GO\s*$/m).filter(x=>x.trim()))await q(batch);
const hash=await bcrypt.hash('HomeFix@123',12);
await transaction(null,async t=>{
 const demo=[['KH','Khách hàng An','kh'],['KTV','Kỹ thuật viên Minh','ktv'],['DPV','Điều phối Linh','dpv'],['CSKH','Chăm sóc khách hàng','cskh'],['KT','Kế toán Hạnh','kt'],['ADMIN','Quản trị HomeFix','admin'],['GD','Giám đốc HomeFix','gd'],['KH','Khách hàng Bình','kh2'],['KTV','Kỹ thuật viên Nam','ktv2']];
 for(let i=0;i<demo.length;i++){
  const [role,name,login]=demo[i];const email=login+'@homefix.local';
  if(await one('SELECT id FROM dbo.NguoiDung WHERE email=@email',{email},t))continue;
  const u=await one("INSERT dbo.NguoiDung(fullName,phone,email,passwordHash,role,defaultAddress) OUTPUT INSERTED.id VALUES(@name,@phone,@email,@hash,@role,N'1 Võ Văn Ngân, TP. Thủ Đức, TP.HCM')",{name,phone:'090000000'+(i+1),email,hash,role},t);
  if(role==='KTV'){
   await q("INSERT dbo.KyThuatVien(id,skillGroup,serviceArea,availability) VALUES(@id,N'DienLanh',N'TP.HCM','SanSang')",{id:u.id},t);
   await q("INSERT dbo.GiaoDichVi(technicianId,type,amount,referenceType,referenceId,note) VALUES(@id,'Opening',1000000,'Opening',@id,N'Số dư mở đầu bộ dữ liệu demo')",{id:u.id},t);
  }
 }
 if(!(await one('SELECT COUNT(*) n FROM dbo.DichVu',{},t)).n){
  const services=[['Sửa máy lạnh','DienLanh','Kiểm tra và sửa máy lạnh tại nhà. Báo giá rõ ràng trước khi thực hiện.',50000,300000],['Vệ sinh máy lạnh','DienLanh','Vệ sinh dàn lạnh, dàn nóng và kiểm tra vận hành.',30000,180000],['Sửa tủ lạnh','DienLanh','Xử lý tủ lạnh không lạnh, chảy nước hoặc hoạt động bất thường.',50000,280000],['Sửa máy giặt','DienGiaDung','Kiểm tra nguồn, thoát nước và sự cố lồng giặt.',50000,250000],['Sửa điện nước','DienNuoc','Sửa rò rỉ, đường ống và thiết bị điện gia đình.',50000,200000],['Vệ sinh thiết bị','VeSinh','Làm sạch và bảo trì định kỳ thiết bị gia đình.',30000,150000]];
  for(const [name,groupCode,description,inspectionFee,laborFee] of services)await q('INSERT dbo.DichVu(name,groupCode,description,inspectionFee,laborFee,commissionRatePercent) VALUES(@name,@groupCode,@description,@inspectionFee,@laborFee,15)',{name,groupCode,description,inspectionFee,laborFee},t);
 }
 for(const [key,value,label] of [['minimumWallet','200000','Số dư tối thiểu nhận việc'],['assignmentMinutes','10','Phút phản hồi lệnh'],['cancellationFee','50000','Phí hủy khi đang di chuyển'],['signatureRequired','false','Yêu cầu chữ ký nghiệm thu']])if(!await one('SELECT [key] FROM dbo.CauHinh WHERE [key]=@key',{key},t))await q('INSERT dbo.CauHinh([key],value,label) VALUES(@key,@value,@label)',{key,value,label},t);
});
await close();console.log('DB ready: '+config.database+'. Seed giữ nguyên dữ liệu và mật khẩu tài khoản đã tồn tại.');
