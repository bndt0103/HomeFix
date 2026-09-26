import {Router} from 'express';import bcrypt from 'bcryptjs';import jwt from 'jsonwebtoken';import {rateLimit} from 'express-rate-limit';
import {config} from './config.js';import {q,one,transaction} from './db.js';
import {z,str,id,ok,wrap,fail,roles,versionSchema,checkVersion,audit} from './common.js';
export const authRouter=Router();
const phone=z.string().regex(/^0\d{9}$/,'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.');
const email=z.email().max(200).transform(s=>s.toLowerCase()).nullable().optional();
const password=z.string().min(8,'Mật khẩu ít nhất 8 ký tự.').refine(s=>Buffer.byteLength(s,'utf8')<=72,'Mật khẩu tối đa 72 byte UTF-8.');
export const userColumns='id,fullName,phone,email,role,defaultAddress,isActive,tokenVersion,createdAt,version';
export const profile=u=>{const {tokenVersion,...safe}=u;return safe;};
export async function auth(req,res,next){
 try{
  const raw=req.get('Authorization');if(!raw?.startsWith('Bearer '))fail(401,'UNAUTHENTICATED','Vui lòng đăng nhập.');
  let token;try{token=jwt.verify(raw.slice(7),config.secret,{algorithms:['HS256'],issuer:'homefix'});}catch{fail(401,'SESSION_EXPIRED','Phiên đã hết hạn. Vui lòng đăng nhập lại.');}
  const u=await one(`SELECT ${userColumns} FROM dbo.NguoiDung WHERE id=@id`,{id:Number(token.sub)});
  if(!u||u.tokenVersion!==token.tokenVersion)fail(401,'SESSION_REVOKED','Phiên đăng nhập đã bị thu hồi.');
  if(!u.isActive)fail(403,'ACCOUNT_DISABLED','Tài khoản đang bị khóa.');req.user=u;next();
 }catch(e){next(e);}
}
const limiter=rateLimit({windowMs:15*60*1000,limit:60,standardHeaders:'draft-8',legacyHeaders:false,message:{error:{code:'RATE_LIMITED',message:'Bạn thử quá nhiều lần. Vui lòng đợi 15 phút.'}}});
authRouter.post('/auth/register',limiter,wrap(async(req,res)=>{
 const b=z.strictObject({fullName:str(2,120),phone,email,password}).parse(req.body);const hash=await bcrypt.hash(b.password,12);
 const u=await transaction(null,async t=>{
  const row=await one(`INSERT dbo.NguoiDung(fullName,phone,email,passwordHash,role) OUTPUT INSERTED.id VALUES(@fullName,@phone,@email,@hash,'KH')`,{...b,hash},t);
  await audit(t,null,'Register','NguoiDung',row.id);return one(`SELECT ${userColumns} FROM dbo.NguoiDung WHERE id=@id`,row,t);
 });ok(res,profile(u),201);
}));
authRouter.post('/auth/login',limiter,wrap(async(req,res)=>{
 const b=z.strictObject({identifier:str(3,200),password:str(1,200)}).parse(req.body);
 const u=await one('SELECT * FROM dbo.NguoiDung WHERE phone=@login OR email=@login',{login:b.identifier.toLowerCase()});
 if(!u||Buffer.byteLength(b.password,'utf8')>72||!await bcrypt.compare(b.password,u.passwordHash))fail(401,'INVALID_CREDENTIALS','Số điện thoại/email hoặc mật khẩu không đúng.');
 if(!u.isActive)fail(403,'ACCOUNT_DISABLED','Tài khoản đang bị khóa.');
 const accessToken=jwt.sign({role:u.role,tokenVersion:u.tokenVersion},config.secret,{subject:String(u.id),expiresIn:'15m',issuer:'homefix',algorithm:'HS256'});
 const {passwordHash,cccd,...safe}=u;ok(res,{accessToken,expiresIn:900,user:profile(safe)});
}));
authRouter.use(auth);
authRouter.get('/auth/me',wrap(async(req,res)=>ok(res,profile(req.user))));
authRouter.post('/auth/logout',wrap(async(req,res)=>{await transaction(req.user,t=>q('UPDATE dbo.NguoiDung SET tokenVersion=tokenVersion+1 WHERE id=@id',{id:req.user.id},t));ok(res,{loggedOut:true});}));
authRouter.get('/users/me',wrap(async(req,res)=>ok(res,profile(req.user))));
authRouter.patch('/users/me',wrap(async(req,res)=>{
 const b=z.strictObject({fullName:str(2,120),email,defaultAddress:str(0,500).nullable().optional(),expectedVersion:versionSchema}).parse(req.body);
 const result=await transaction(req.user,async t=>{const u=await one('SELECT * FROM dbo.NguoiDung WHERE id=@id',{id:req.user.id},t);checkVersion(u,b.expectedVersion);await q('UPDATE dbo.NguoiDung SET fullName=@fullName,email=@email,defaultAddress=@defaultAddress WHERE id=@id',{...b,id:u.id},t);return one(`SELECT ${userColumns} FROM dbo.NguoiDung WHERE id=@id`,{id:u.id},t);});ok(res,profile(result));
}));
authRouter.post('/users/me/password',wrap(async(req,res)=>{
 const b=z.strictObject({currentPassword:str(1,200),newPassword:password}).parse(req.body);const hash=await bcrypt.hash(b.newPassword,12);
 await transaction(req.user,async t=>{const u=await one('SELECT passwordHash FROM dbo.NguoiDung WHERE id=@id',{id:req.user.id},t);if(Buffer.byteLength(b.currentPassword)>72||!await bcrypt.compare(b.currentPassword,u.passwordHash))fail(422,'WRONG_PASSWORD','Mật khẩu hiện tại không đúng.');await q('UPDATE dbo.NguoiDung SET passwordHash=@hash,tokenVersion=tokenVersion+1 WHERE id=@id',{hash,id:req.user.id},t);});ok(res,{loginRequired:true});
}));
authRouter.get('/users',roles('ADMIN'),wrap(async(req,res)=>ok(res,(await q(`SELECT ${userColumns} FROM dbo.NguoiDung ORDER BY id DESC`)).map(profile))));
authRouter.post('/users',roles('ADMIN'),wrap(async(req,res)=>{
 const b=z.strictObject({fullName:str(2,120),phone,email,role:z.enum(['KH','KTV','DPV','CSKH','KT','ADMIN','GD']),initialPassword:password,technicianProfile:z.strictObject({skillGroup:str(1,60),serviceArea:str(1,120)}).optional()}).parse(req.body);
 if(b.role==='KTV'&&!b.technicianProfile)fail(422,'PROFILE_REQUIRED','Cần chuyên môn và khu vực kỹ thuật viên.');const hash=await bcrypt.hash(b.initialPassword,12);
 const u=await transaction(req.user,async t=>{const u=await one('INSERT dbo.NguoiDung(fullName,phone,email,passwordHash,role) OUTPUT INSERTED.id VALUES(@fullName,@phone,@email,@hash,@role)',{...b,hash,technicianProfile:null},t);if(b.role==='KTV')await q('INSERT dbo.KyThuatVien(id,skillGroup,serviceArea) VALUES(@id,@skillGroup,@serviceArea)',{id:u.id,...b.technicianProfile},t);await audit(t,req.user,'CreateUser','NguoiDung',u.id);return one(`SELECT ${userColumns} FROM dbo.NguoiDung WHERE id=@id`,u,t);});ok(res,profile(u),201);
}));
authRouter.patch('/users/:id',roles('ADMIN'),wrap(async(req,res)=>{
 const uid=id(req.params.id),b=z.strictObject({fullName:str(2,120),isActive:z.boolean(),expectedVersion:versionSchema}).parse(req.body);
 const u=await transaction(req.user,async t=>{const current=await one('SELECT * FROM dbo.NguoiDung WHERE id=@id',{id:uid},t);checkVersion(current,b.expectedVersion);if(!b.isActive&&current.role==='ADMIN'&&(await one("SELECT COUNT(*) n FROM dbo.NguoiDung WHERE role='ADMIN' AND isActive=1",{},t)).n<=1)fail(409,'LAST_ADMIN','Không thể khóa quản trị viên cuối cùng.');if(!b.isActive&&current.role==='KTV'&&await one('SELECT id FROM dbo.LenhDieuPhoi WHERE technicianId=@id AND isActive=1',{id:uid},t))fail(409,'ACTIVE_ASSIGNMENT','Kỹ thuật viên đang có ca, cần hoàn tất hoặc điều phối lại.');await q('UPDATE dbo.NguoiDung SET fullName=@fullName,isActive=@isActive,tokenVersion=tokenVersion+1 WHERE id=@id',{...b,id:uid},t);await audit(t,req.user,'UpdateUser','NguoiDung',uid);return one(`SELECT ${userColumns} FROM dbo.NguoiDung WHERE id=@id`,{id:uid},t);});ok(res,profile(u));
}));
