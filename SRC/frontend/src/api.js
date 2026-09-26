import {Capacitor} from '@capacitor/core';
let token='';let onUnauthorized=()=>{};
export function setSession(accessToken,handler){token=accessToken||'';if(handler)onUnauthorized=handler;}
export const native=Capacitor.isNativePlatform();
export function baseUrl(){return (localStorage.getItem('homefix.api')||import.meta.env.VITE_API_BASE_URL||(native?'http://10.0.2.2:3000/api':'/api')).replace(/\/$/,'');}
export function saveBaseUrl(value){const u=new URL(value);if(!['http:','https:'].includes(u.protocol))throw new Error('Địa chỉ phải bắt đầu bằng http:// hoặc https://');if(u.username||u.password||u.search||u.hash)throw new Error('Địa chỉ API không được chứa mật khẩu hoặc tham số.');localStorage.setItem('homefix.api',u.href.replace(/\/$/,'').replace(/\/api$/,'')+'/api');setSession('');}
export async function api(path,{method='GET',body,key,blob=false,signal}={}){
 const headers={};if(token)headers.Authorization='Bearer '+token;if(body&&!(body instanceof FormData))headers['Content-Type']='application/json';if(key)headers['Idempotency-Key']=key;
 let r;try{r=await fetch(baseUrl()+path,{method,headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined,signal});}catch(e){if(e.name==='AbortError')throw e;throw new Error('Không kết nối được máy chủ. Kiểm tra mạng và địa chỉ API trong Cài đặt kết nối.');}
 if(!r.ok){const data=await r.json().catch(()=>({}));if(r.status===401&&token){setSession('');onUnauthorized();}const e=new Error(data.error?.message||'Không thể xử lý yêu cầu.');e.status=r.status;e.code=data.error?.code;e.details=data.error?.details;e.requestId=data.requestId;throw e;}
 return blob?r.blob():r.json();
}
export async function upload(file,purpose,orderId){const body=new FormData();body.set('file',file);body.set('purpose',purpose);if(orderId)body.set('orderId',String(orderId));return (await api('/uploads',{method:'POST',body})).data;}
// getRandomValues also works on HTTP LAN addresses used for classroom demos.
export const uuid=()=>{if(crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=[...b].map(n=>n.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;};
