import {q,close} from '../backend/src/db.js';

// Read-only preflight: do not publish a server with known missing UI dependencies.
const required=[
 ['ViTriKhachHang','orderId','db:migrate:customer-location'],
 ['DeXuatChinhSach','id','db:migrate:policies'],
 ['NguoiDung','avatarUrl','db:migrate:avatar'],
 ['NguoiDung','lockedUntil','db:migrate:account-locks'],
 ['DichVu','isPopular','db:migrate:services'],
 ['AuthOtp','id','db:migrate:otp'],
 ['DonHang','paymentMethod','db:migrate:payments'],
 ['TaiKhoanNhanTien','id','db:migrate:payments'],
 ['YeuCauThanhToan','id','db:migrate:payments'],
 ['ThanhToan','bankAccountId','db:migrate:payments'],
 ['ThanhToan','bankReference','db:migrate:payments'],
 ...['profileJson','frontDocumentId','backDocumentId','identityNumber'].map(column=>['HoSoKTV',column,'db:migrate:technician-ui']),
 ['PhieuNghiemThu','proposedPaymentMethod','db:migrate:technician-ui']
];
try {
 const rows=await q(`SELECT t.name AS tableName,c.name AS columnName
  FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id
  WHERE SCHEMA_NAME(t.schema_id)='dbo'`);
 const columns=new Set(rows.map(row=>`${row.tableName}.${row.columnName}`));
 const missing=required.filter(([table,column])=>!columns.has(`${table}.${column}`));
 if(missing.length){
  console.error('Database chua du cau truc cho ban hien tai: '+missing.map(([t,c])=>`${t}.${c}`).join(', '));
  console.error('Chay trong SRC, sau do khoi dong lai online:\n'+[...new Set(missing.map(([, ,migration])=>'npm.cmd run '+migration))].join('\n'));
  process.exitCode=1;
 }else console.log('Database san sang cho giao dien, thanh toan va ho so KTV.');
}catch(error){console.error('Khong kiem tra duoc database: '+error.message);process.exitCode=1;}
finally{await close();}
