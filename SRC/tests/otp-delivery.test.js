import test from 'node:test';
import assert from 'node:assert/strict';
import {deliverOtp,deliveryConfigured} from '../backend/src/otp-delivery.js';

test('Email OTP is sent server-side through Resend',async()=>{
 const env={RESEND_API_KEY:'test-key',OTP_EMAIL_FROM:'HomeFix <otp@example.com>'};
 await deliverOtp('customer@gmail.com','123456',{env,fetcher:async(url,options)=>{
  assert.equal(url,'https://api.resend.com/emails');
  const body=JSON.parse(options.body);assert.deepEqual(body.to,['customer@gmail.com']);
  assert.match(body.text,/123456/);assert.equal(options.headers.Authorization,'Bearer test-key');return {ok:true};
 }});
});
test('Missing credentials and provider failures cannot report successful delivery',async()=>{
 assert.equal(deliveryConfigured({}),false);
 await assert.rejects(deliverOtp('test@example.com','123456',{env:{}}),/NOT_CONFIGURED/);
 await assert.rejects(deliverOtp('test@example.com','123456',{env:{RESEND_API_KEY:'test',OTP_EMAIL_FROM:'test@example.com'},fetcher:async()=>({ok:false})}),/DELIVERY_FAILED/);
});
