import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
const base=process.env.HOMEFIX_TEST_URL||'http://localhost:3101',dir='test-results/screenshots/attention';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const faults=[],checks=[];let orderId,kh,dpv,khToken;
async function login(role){const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',e=>faults.push(e.message));await page.goto(base);await page.getByLabel('Số điện thoại hoặc email').fill(role+'@homefix.local');await page.getByLabel('Mật khẩu',{exact:true}).fill('HomeFix@123');const response=page.waitForResponse(r=>r.url().endsWith('/api/auth/login')&&r.request().method()==='POST');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();const token=(await (await response).json()).data.accessToken;await page.locator('.app-shell').waitFor();return {page,token};}
async function nav(page,path){await page.evaluate(p=>{history.pushState({},'',p);dispatchEvent(new PopStateEvent('popstate'));},path);}
async function summary(page,token){const r=await page.request.get(base+'/api/attention-summary',{headers:{Authorization:'Bearer '+token}});assert.equal(r.status(),200);return (await r.json()).data;}
try{
 ({page:kh,token:khToken}=await login('kh'));const dispatcher=await login('dpv');dpv=dispatcher.page;
 await nav(kh,'/book/1');await kh.getByLabel('Địa chỉ thực hiện').fill('1 Võ Văn Ngân, Thủ Đức, TP.HCM');await kh.getByLabel('Thiết bị gặp vấn đề gì?').fill('[UI TEST thông báo] Kiểm tra nút duyệt báo giá giữa hai phiên đăng nhập.');await kh.getByRole('button',{name:'Gửi yêu cầu đặt dịch vụ'}).click();await kh.waitForURL(/\/orders\/\d+$/);orderId=Number(kh.url().split('/').at(-1));
 await nav(kh,'/');
 await dpv.locator('.sidebar nav .attention-dot').first().waitFor({timeout:20000});
 assert.ok((await summary(dpv,dispatcher.token)).orderIds.includes(orderId));
 await nav(dpv,'/orders/'+orderId);await dpv.getByRole('button',{name:/Lập báo giá sơ bộ/}).click();let dialog=dpv.getByRole('dialog');await dialog.getByLabel('Chẩn đoán sơ bộ').fill('Báo giá kiểm tra thiết bị cho bài kiểm thử tự cập nhật.');await dialog.getByRole('button',{name:'Xác nhận',exact:true}).click();await dialog.waitFor({state:'hidden'});
 // Customer stays on the already-open home page: no reload and no manual update click.
 const card=kh.locator('a.order-card[href="/orders/'+orderId+'"]');await card.getByText('Xem và chấp nhận báo giá sơ bộ',{exact:true}).waitFor({timeout:25000});await card.locator('.attention-dot').waitFor({timeout:15000});await kh.locator('.notification-bell .attention-dot').waitFor();
 assert.ok((await summary(kh,khToken)).orderIds.includes(orderId));assert.ok(!(await summary(dpv,dispatcher.token)).orderIds.includes(orderId));
 await kh.screenshot({path:dir+'/customer-quote-home.png',fullPage:true});checks.push('Customer home and menu automatically show pending quote; dispatcher task clears');
 await kh.getByRole('link',{name:'Thông báo',exact:true}).click();const notification=kh.locator('article.notification').filter({has:kh.locator('a[href="/orders/'+orderId+'"]')}).filter({has:kh.getByRole('heading',{name:'Báo giá sơ bộ cần xác nhận',exact:true})});
 await notification.getByRole('button',{name:'Đánh dấu đã đọc',exact:true}).click();assert.ok((await summary(kh,khToken)).orderIds.includes(orderId));checks.push('Reading message does not clear outstanding approval');
 await notification.getByRole('link',{name:/Xem đơn dịch vụ/}).click();await kh.getByRole('button',{name:/Đồng ý báo giá/}).waitFor();await kh.screenshot({path:dir+'/customer-approve-quote.png',fullPage:true});
 await kh.getByRole('button',{name:/Đồng ý báo giá/}).click();dialog=kh.getByRole('dialog');await dialog.getByRole('button',{name:'Xác nhận',exact:true}).click();await dialog.waitFor({state:'hidden'});
 assert.ok(!(await summary(kh,khToken)).orderIds.includes(orderId));
 // Dispatcher stays on order detail while customer approves. No manual refresh.
 await dpv.getByRole('button',{name:/Phân công kỹ thuật viên/}).waitFor({timeout:25000});assert.ok((await summary(dpv,dispatcher.token)).orderIds.includes(orderId));checks.push('Customer approves successfully; dispatcher automatically receives assignment action');
 await kh.setViewportSize({width:390,height:844});assert.ok(await kh.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 for(const role of ['kt','ktv','cskh','admin']){const {page,token}=await login(role);await page.waitForResponse(r=>r.url().endsWith('/api/attention-summary')).catch(()=>{});const s=await summary(page,token);if(s.unread||s.orderIds.length||Object.values(s.finance).some(Number)||s.support||s.applications)await page.locator('.notification-bell .attention-dot').waitFor();if(role==='kt'&&Number(s.finance.settlements)>0)await page.locator('.sidebar nav a[href="/finance?tab=wallet"] .attention-dot').waitFor();await page.context().close();}
 checks.push('Attention provider is mounted for accounting, technician, support and admin');assert.deepEqual(faults,[]);console.log('Attention and quote flow PASS:',checks);
}finally{
 if(orderId&&khToken){const r=await fetch(base+'/api/orders/'+orderId,{headers:{Authorization:'Bearer '+khToken}});if(r.ok){const o=(await r.json()).data;if(['ChoTiepNhan','ChoDuyetSoBo','ChoPhanCong'].includes(o.status))await fetch(base+'/api/orders/'+orderId+'/cancel',{method:'POST',headers:{Authorization:'Bearer '+khToken,'Content-Type':'application/json'},body:JSON.stringify({reason:'Đơn kiểm thử thông báo đã hoàn thành, không điều phối thật.',expectedVersion:o.version})});}}
 fs.writeFileSync('test-results/attention-flow.json',JSON.stringify({executedAt:new Date().toISOString(),orderId,checks,faults},null,2));await browser.close();
}
