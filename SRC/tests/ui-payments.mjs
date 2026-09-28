import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import {paymentHarness} from './helpers/payments.mjs';
assert.match(process.env.DB_NAME||'',/^HomeFix_.*Test/,'Use an isolated test database');
const base=process.env.HOMEFIX_TEST_URL||'http://localhost:3002';
const h=await paymentHarness(base+'/api'),fixture=await h.acceptance(),faults=[],checks=[];
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
fs.mkdirSync('test-results/screenshots',{recursive:true});
await sharp({create:{width:100,height:100,channels:3,background:'#167943'}}).png().toFile('test-results/bank-proof.png');
async function login(role){
 const page=await browser.newPage({viewport:{width:1400,height:1000}});
 page.setDefaultTimeout(12000);page.on('pageerror',e=>faults.push(e.message));
 await page.goto(base);await page.getByLabel('Số điện thoại hoặc email').fill(role+'@homefix.local');
 await page.getByLabel('Mật khẩu',{exact:true}).fill('HomeFix@123');
 await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.locator('.app-shell').waitFor();return page;
}
async function nav(page,path){await page.evaluate(p=>{history.pushState({},'',p);dispatchEvent(new PopStateEvent('popstate'));},path);await page.waitForTimeout(500);}
async function typed(field,value,poll=false){
 await field.click();await field.pressSequentially(value,{delay:30});
 assert.equal(await field.inputValue(),value);assert.ok(await field.evaluate(el=>el===document.activeElement),'Focus lost while typing');
 if(poll){const caret=await field.evaluate(el=>el.selectionStart);await field.page().waitForTimeout(11000);assert.ok(await field.evaluate(el=>el===document.activeElement),'Focus lost on polling');assert.equal(await field.inputValue(),value);assert.equal(await field.evaluate(el=>el.selectionStart),caret);}
}
async function submit(dialog,label){
 await dialog.getByRole('button',{name:label,exact:true}).click();
 await Promise.race([dialog.waitFor({state:'hidden'}),dialog.getByRole('alert').waitFor().then(async()=>{throw Error(await dialog.getByRole('alert').innerText());})]);
}
try{
 const admin=await login('admin');await nav(admin,'/admin/settings');
 const opener=admin.getByRole('button',{name:'Thêm tài khoản nhận tiền',exact:true});await opener.click();
 let d=admin.getByRole('dialog');await d.getByLabel(/^Ngân hàng/).selectOption('VCB');
 await typed(d.getByLabel('Số tài khoản',{exact:true}),'000'+h.stamp);
 await typed(d.getByLabel('Tên chủ tài khoản',{exact:true}),'TEST UI ACCOUNT ONLY');
 await d.getByLabel('Tên chủ tài khoản',{exact:true}).evaluate(el=>el.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',isComposing:true,bubbles:true})));
 assert.equal(await d.count(),1);
 await d.getByRole('button',{name:'Thêm tài khoản',exact:true}).focus();await admin.keyboard.press('Tab');
 assert.ok(await d.getByRole('button',{name:'Đóng',exact:true}).evaluate(el=>el===document.activeElement),'Tab wraps');
 await admin.keyboard.press('Escape');await d.waitFor({state:'hidden'});assert.ok(await opener.evaluate(el=>el===document.activeElement),'Focus restored');
 await opener.click();d=admin.getByRole('dialog');await d.getByLabel(/^Ngân hàng/).selectOption('VCB');
 await d.getByLabel('Số tài khoản',{exact:true}).fill('000'+h.stamp);await d.getByLabel('Tên chủ tài khoản',{exact:true}).fill('TEST UI ACCOUNT ONLY');await d.getByRole('checkbox').check();await submit(d,'Thêm tài khoản');
 const bank=(await h.request('GET','/bank-accounts',null,'ADMIN')).find(x=>x.accountNumber==='000'+h.stamp);assert.ok(bank);checks.push('Admin account + typing, Tab, Escape, IME');
 const kh=await login('kh');await nav(kh,'/orders/'+fixture.order.id);
 await kh.getByRole('button',{name:'Xác nhận nghiệm thu',exact:true}).click();d=kh.getByRole('dialog');
 await d.getByRole('radio',{name:/Chuyển khoản ngân hàng/}).check();
 await d.getByLabel('Ngân hàng / tài khoản nhận tiền').selectOption(String(bank.id));await d.getByRole('checkbox').check();await submit(d,'Xác nhận');
 await kh.getByRole('button',{name:'Tôi đã chuyển khoản',exact:true}).click();d=kh.getByRole('dialog');
 await typed(d.getByLabel('Mã giao dịch trên biên lai (nếu có)'),'TEST-CUSTOMER-'+h.stamp,true);
 await d.locator('input[type=file]').setInputFiles('test-results/bank-proof.png');await d.getByRole('checkbox').check();await submit(d,'Gửi chứng từ');
 assert.equal((await h.order(fixture.order.id)).paymentStatus,'Unpaid');checks.push('Customer BANK acceptance + proof, focus stable through 10s polling');
 await kh.setViewportSize({width:390,height:844});await kh.screenshot({path:'test-results/screenshots/bank-customer-mobile.png',fullPage:true});
 assert.ok(await kh.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile overflow');
 const kt=await login('kt');await nav(kt,'/finance');await kt.getByRole('button',{name:'Chuyển khoản chờ xác minh',exact:true}).click();
 const code='HF-'+String(fixture.order.id).padStart(6,'0');
 let row=kt.getByRole('row').filter({has:kt.getByRole('link',{name:code,exact:true})});
 await row.getByRole('button',{name:'Xem chứng từ',exact:true}).click();d=kt.getByRole('dialog');
 await d.getByAltText('Chứng từ chuyển khoản khách gửi').waitFor();
 await typed(d.getByLabel('Số tiền thực nhận (đ)'),String(Number(fixture.acceptance.total)));
 await typed(d.getByLabel('Mã giao dịch trên sao kê ngân hàng'),'TEST-UI-'+h.stamp,true);
 await d.getByRole('checkbox').check();await kt.screenshot({path:'test-results/screenshots/bank-accountant-review.png',fullPage:true});await submit(d,'Xác nhận kết quả');
 assert.equal((await h.order(fixture.order.id)).paymentStatus,'Paid');
 await kt.getByRole('button',{name:'Đối soát thanh toán',exact:true}).click();
 row=kt.getByRole('row').filter({has:kt.getByRole('link',{name:code,exact:true})});await row.getByRole('button',{name:'Đối soát',exact:true}).click();
 await submit(kt.getByRole('dialog'),'Xác nhận xử lý');checks.push('Accountant proof, focus through polling, bank confirmation and settlement');
 await nav(kh,'/orders/'+fixture.order.id);await kh.getByRole('button',{name:'Đánh giá dịch vụ',exact:true}).click();d=kh.getByRole('dialog');
 await typed(d.getByLabel('Nhận xét của bạn'),'Dich vu da duoc kiem tra thanh toan.',true);await submit(d,'Xác nhận');checks.push('Existing review textarea through polling');
 assert.deepEqual(faults,[]);console.log('PASS',JSON.stringify(checks));
}catch(e){faults.push(e.message);for(const [i,context] of browser.contexts().entries())await context.pages()[0]?.screenshot({path:'test-results/screenshots/bank-failure-'+i+'.png',fullPage:true}).catch(()=>{});throw e;}
finally{await browser.close();fs.writeFileSync('test-results/ui-payments.json',JSON.stringify({checks,faults,orderId:fixture.order.id,at:new Date().toISOString()},null,2));}
