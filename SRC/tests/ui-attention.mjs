import assert from 'node:assert/strict';
import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../frontend/dist');
const app=express();app.use(express.static(root));app.get(/.*/,(req,res)=>res.sendFile(path.join(root,'index.html')));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const faults=[];
async function until(check){for(let i=0;i<60;i++){if(await check())return;await new Promise(r=>setTimeout(r,100));}assert.fail('UI condition timed out');}
try{
 for(const role of ['KH','DPV','KTV','KT']){
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>faults.push(e.message));
  const user={id:1,role,fullName:'Test HomeFix',phone:'0900000000'};
  let summary={unread:1,orderIds:role==='KT'?[]:[9],finance:{settlements:role==='KT'?1:0,bank:role==='KT'?1:0,wallet:role==='KT'?1:0}};
  const order={id:9,status:'ChoNhan',serviceName:'Test repair',assignedTechnicianId:1,paymentStatus:'Unpaid',paymentMethod:'COD',version:'test',address:'Test address',createdAt:new Date().toISOString(),currentAssignment:{status:'Pending',expiresAt:new Date(Date.now()+300000).toISOString()}};
  await page.route('**/api/**',async route=>{
   const url=new URL(route.request().url()),p=url.pathname;
   let data=[];
   if(p==='/api/auth/login')data={accessToken:'test',user};
   else if(p==='/api/attention-summary')data=summary;
   else if(p==='/api/notifications')data=[{id:1,title:'Thông báo thử',body:'Test',createdAt:order.createdAt,readAt:summary.unread?null:order.createdAt}];
   else if(p==='/api/notifications/1/read'){summary={...summary,unread:0};data={};}
   else if(p==='/api/orders')data=[order];
   else if(p==='/api/orders/9')data=order;
   else if(p==='/api/technicians/me')data={availability:'SanSang',balance:300000,walletEligibility:{minimum:200000}};
   else if(p==='/api/reports/summary')data={};
   else if(p==='/api/app-config')data={};
   await route.fulfill({json:{data,meta:{total:1}}});
  });
  await page.goto(base);
  await page.getByLabel('Số điện thoại hoặc email').fill('test@example.com');
  await page.getByLabel('Mật khẩu',{exact:true}).fill('TestPassword1');
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await page.locator('.app-shell').waitFor();
  await until(async()=>await page.locator('.notification-bell .attention-dot').count()===1);
  const nav=async p=>{await page.evaluate(p=>{history.pushState({},'',p);dispatchEvent(new PopStateEvent('popstate'));},p);};
  await nav('/notifications');
  await page.getByRole('button',{name:'Đánh dấu đã đọc'}).click();
  await until(async()=>await page.getByRole('button',{name:'Đánh dấu đã đọc'}).count()===0);
  assert.equal(await page.locator('.notification-bell .attention-dot').count(),1,'Unread cleared must not clear outstanding work');
  if(role==='KT'){
   await nav('/finance');await page.locator('.sidebar nav a[href="/finance?tab=revenue"]').waitFor();
   assert.equal(await page.locator('.sidebar nav a[href^="/finance"] .attention-dot').count(),3);
   summary={...summary,finance:{settlements:0,bank:0,wallet:0}};
  }else{
   await nav('/orders/9');await page.getByRole('heading',{name:'Test repair'}).waitFor();
   if(role==='KH')assert.equal(await page.getByText(/Chờ kỹ thuật viên nhận việc|Vui lòng nhận hoặc từ chối công việc trong|Thời gian phản hồi/).count(),0);
   if(role==='DPV')await page.getByText(/Chờ kỹ thuật viên nhận việc · Còn/).waitFor();
   if(role==='KTV')await page.getByText(/Vui lòng nhận hoặc từ chối công việc trong/).waitFor();
   summary={...summary,orderIds:[]};
  }
  await page.evaluate(()=>window.dispatchEvent(new Event('homefix:changed')));
  await until(async()=>await page.locator('.notification-bell .attention-dot').count()===0);
  if(role==='KT')assert.equal(await page.locator('.sidebar nav a[href^="/finance"] .attention-dot').count(),0);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Mobile overflow');
  await page.close();
  console.log('PASS',role,'countdown, unread versus pending work, cleared tasks, mobile');
 }
 assert.deepEqual(faults,[]);
}finally{await browser.close();await new Promise(r=>server.close(r));}
