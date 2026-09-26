// Provider credentials stay on the server. Never return or log the OTP.
export function deliveryConfigured(channel, env=process.env) {
 return channel==='email'
  ? Boolean(env.RESEND_API_KEY && env.OTP_EMAIL_FROM)
  : Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_SMS_FROM);
}
export async function deliverOtp(channel, destination, code, {env=process.env, fetcher=fetch}={}) {
 if(!deliveryConfigured(channel,env))throw new Error('OTP_PROVIDER_NOT_CONFIGURED');
 const text=`HomeFix: Ma xac thuc cua ban la ${code}. Het han sau 5 phut. Khong chia se ma nay.`;
 let response;
 if(channel==='email') {
  response=await fetcher('https://api.resend.com/emails',{
   method:'POST',signal:AbortSignal.timeout(15000),
   headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
   body:JSON.stringify({from:env.OTP_EMAIL_FROM,to:[destination],subject:'HomeFix - Mã xác thực OTP',text})
  });
 } else {
  response=await fetcher(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.TWILIO_ACCOUNT_SID)}/Messages.json`,{
   method:'POST',signal:AbortSignal.timeout(15000),
   headers:{Authorization:'Basic '+Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},
   body:new URLSearchParams({From:env.TWILIO_SMS_FROM,To:'+84'+destination.slice(1),Body:text}).toString()
  });
 }
 if(!response.ok)throw new Error('OTP_DELIVERY_FAILED');
}
