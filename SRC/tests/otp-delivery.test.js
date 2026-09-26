import test from 'node:test';
import assert from 'node:assert/strict';
import {deliverOtp,deliveryConfigured} from '../backend/src/otp-delivery.js';

test('Email OTP is sent server-side through Resend',async()=>{
 const env={RESEND_API_KEY:'test-key',OTP_EMAIL_FROM:'HomeFix <otp@example.com>'};
 await deliverOtp('email','customer@gmail.com','123456',{env,fetcher:async(url,options)=>{
  assert.equal(url,'https://api.resend.com/emails');
  const body=JSON.parse(options.body);assert.deepEqual(body.to,['customer@gmail.com']);
  assert.match(body.text,/123456/);assert.equal(options.headers.Authorization,'Bearer test-key');return {ok:true};
 }});
});
test('SMS OTP converts Vietnamese local numbers to E.164',async()=>{
 const env={TWILIO_ACCOUNT_SID:'ACtest',TWILIO_AUTH_TOKEN:'test',TWILIO_SMS_FROM:'+15005550006'};
 await deliverOtp('sms','0912345678','654321',{env,fetcher:async(url,options)=>{
  assert.match(url,/Accounts\/ACtest\/Messages.json$/);const body=new URLSearchParams(options.body);
  assert.equal(body.get('To'),'+84912345678');assert.match(body.get('Body'),/654321/);return {ok:true};
 }});
});
test('Missing credentials and provider failures cannot report successful delivery',async()=>{
 assert.equal(deliveryConfigured('email',{}),false);assert.equal(deliveryConfigured('sms',{}),false);
 await assert.rejects(deliverOtp('email','test@example.com','123456',{env:{}}),/NOT_CONFIGURED/);
 await assert.rejects(deliverOtp('email','test@example.com','123456',{env:{RESEND_API_KEY:'test',OTP_EMAIL_FROM:'test@example.com'},fetcher:async()=>({ok:false})}),/DELIVERY_FAILED/);
});
