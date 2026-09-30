import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL?.replace(/\/api$/,'')||'http://localhost:3101',folder='test-results/screenshots/director-merge';
fs.mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const checks=[],faults=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'vi-VN'});
 page.on('pageerror',e=>faults.push(e.message));
 page.on('response',r=>{if(r.url().startsWith(base+'/api/')&&r.status()>=400)faults.push(r.status()+' '+r.url());});
 await page.goto(base);await page.getByLabel('Số điện thoại hoặc email').fill('gd@homefix.local');await page.getByLabel('Mật khẩu',{exact:true}).fill('HomeFix@123');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.locator('.app-shell').waitFor();
 const nav=page.locator('.sidebar nav');assert.equal(await nav.getByRole('link').count(),5);
 for(const [label,title] of [['Tổng quan điều hành','Executive Dashboard - Chỉ số KPI & Doanh thu'],['Phê duyệt chính sách','Phê duyệt chính sách & Bảng giá mới']]){
  await nav.getByRole('link',{name:label,exact:true}).click();await page.getByRole('heading',{name:title,exact:true}).waitFor();assert.equal(await nav.locator('a.active').count(),1);await page.screenshot({path:folder+'/'+(label.startsWith('Tổng')?'overview':'policies')+'.png',fullPage:true});
 }
 checks.push('Five sidebar entries; team overview and policy screens retained');
 for(const [label,title,file] of [['Khách hàng & chất lượng','Khách hàng & chất lượng dịch vụ','quality'],['Báo cáo tài chính','Dòng tiền, doanh thu & lợi nhuận','finance'],['Hiệu suất KTV','Hiệu suất & năng suất KTV','performance']]){
  await nav.getByRole('link',{name:label,exact:true}).click();await page.getByRole('heading',{name:title,exact:true}).waitFor();await page.getByRole('heading',{name:'Cài đặt giám sát',exact:true}).waitFor();
  assert.equal(await nav.locator('a.active').count(),1);assert.equal(await nav.locator('a.active').innerText(),label);
  assert.equal(await page.getByRole('switch').count(),3);
  const target=page.getByRole('switch').last(),original=await target.isChecked();
  const saved=page.waitForResponse(r=>r.url().includes('/reports/monitoring')&&r.request().method()==='PATCH');await target.click();assert.equal((await saved).status(),200);
  await nav.getByRole('link',{name:'Tổng quan điều hành',exact:true}).click();await nav.getByRole('link',{name:label,exact:true}).click();await page.getByRole('switch').last().waitFor();assert.equal(await page.getByRole('switch').last().isChecked(),!original);
  const restored=page.waitForResponse(r=>r.url().includes('/reports/monitoring')&&r.request().method()==='PATCH');await page.getByRole('switch').last().click();assert.equal((await restored).status(),200);
  const download=page.waitForEvent('download');await page.getByRole('button',{name:file==='finance'?'Xuất CSV':'Xuất báo cáo',exact:true}).click();const result=await download;await result.saveAs(folder+'/'+file+'.csv');assert.ok(fs.readFileSync(folder+'/'+file+'.csv','utf8').length>20);
  await page.screenshot({path:folder+'/'+file+'-desktop.png',fullPage:true});
  if(file==='performance'){
   await page.getByLabel('Chuyên môn',{exact:true}).selectOption('DienNuoc');assert.equal(await page.getByLabel('Chuyên môn',{exact:true}).inputValue(),'DienNuoc');await page.getByLabel('Chuyên môn',{exact:true}).selectOption('all');
   await page.locator('.report-detail-section').getByRole('button',{name:'Xem chi tiết',exact:true}).first().click();await page.getByRole('dialog').waitFor();await page.getByRole('dialog').getByRole('button',{name:'Đóng',exact:true}).click();
   await page.getByLabel('Chuyên môn',{exact:true}).selectOption('all');
   await page.getByLabel('Tìm kỹ thuật viên').fill('Không có kỹ thuật viên này');await page.getByRole('heading',{name:'Chưa có kỹ thuật viên phù hợp'}).waitFor();await page.getByLabel('Tìm kỹ thuật viên').fill('');
  }
  await page.getByLabel('Từ ngày',{exact:true}).fill('2099-01-01');await page.getByLabel('Đến hết ngày',{exact:true}).fill('2099-01-31');
  const filtered=page.waitForResponse(r=>r.url().includes(file==='quality'?'/reports/quality?':file==='finance'?'/reports/finance?':'/reports/performance?')&&r.status()===200);
  await page.getByRole('button',{name:file==='finance'?'Áp dụng':'Lọc',exact:true}).click();await filtered;
  await page.getByRole('button',{name:'Toàn bộ thời gian',exact:true}).click();
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file+' horizontal overflow');
  await page.screenshot({path:folder+'/'+file+'-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Mở menu',exact:true}).click();await nav.getByRole('link',{name:file==='quality'?'Hiệu suất KTV':'Khách hàng & chất lượng',exact:true}).click();assert.equal(await page.locator('.sidebar.opened').count(),0);
  await page.setViewportSize({width:1440,height:1000});
  checks.push(file+': correct sidebar, persisted switches, CSV, period filter, mobile layout');
 }
 assert.deepEqual(faults,[]);console.log('Director UI PASS:',checks);
}finally{await browser.close();fs.writeFileSync('test-results/director-ui-results.json',JSON.stringify({executedAt:new Date().toISOString(),checks,faults},null,2));}
