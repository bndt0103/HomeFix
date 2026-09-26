// Credentials stay on the server. Never return or log the OTP.
export function deliveryConfigured(env=process.env) {
 return Boolean(env.RESEND_API_KEY && env.OTP_EMAIL_FROM);
}
export async function deliverOtp(destination, code, {env=process.env, fetcher=fetch}={}) {
 if(!deliveryConfigured(env))throw new Error('OTP_PROVIDER_NOT_CONFIGURED');
 const text=`HomeFix: Mã xác thực của bạn là ${code}. Hết hạn sau 5 phút. Không chia sẻ mã này.`;
 const response=await fetcher('https://api.resend.com/emails',{
  method:'POST',signal:AbortSignal.timeout(15000),
  headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
  body:JSON.stringify({from:env.OTP_EMAIL_FROM,to:[destination],subject:'HomeFix - Mã xác thực OTP',text})
 });
 if(!response.ok)throw new Error('OTP_DELIVERY_FAILED');
}
