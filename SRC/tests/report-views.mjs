import {chromium} from 'playwright';import fs from 'node:fs';
const workflow=JSON.parse(fs.readFileSync('test-results/ui-workflow-results.json','utf8'));
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{for(const [role,paths] of [['kh',['/book/1','/orders/'+workflow.orderId]],['ktv',['/','/orders/'+workflow.orderId]]]){
 const ctx=await browser.newContext({viewport:{width:390,height:844},locale:'vi-VN'}),p=await ctx.newPage();await p.goto('http://localhost:3000');await p.getByLabel('Số điện thoại hoặc email').fill(role+'@homefix.local');await p.getByLabel('Mật khẩu',{exact:true}).fill('HomeFix@123');await p.getByRole('button',{name:'Đăng nhập',exact:true}).click();await p.locator('.app-shell').waitFor();
 for(const path of paths){await p.evaluate(v=>{history.pushState({},'',v);dispatchEvent(new PopStateEvent('popstate'));},path);await p.waitForTimeout(800);await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'test-results/screenshots/report-'+role+'-'+(path.startsWith('/orders')?'order':path.startsWith('/book')?'book':'home')+'.png'});
 if(role==='kh'&&path.startsWith('/orders')){const card=p.locator('.card').filter({has:p.getByRole('heading',{name:'Phiếu nghiệm thu · Phiên bản 1',exact:true})});await card.screenshot({path:'test-results/screenshots/report-acceptance-card.png'});}
 }
 await ctx.close();
}}finally{await browser.close();}
console.log('Report screenshots captured from running app, no image manipulation.');
