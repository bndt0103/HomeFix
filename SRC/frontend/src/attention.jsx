import React,{createContext,useContext,useEffect,useState} from 'react';
import {api} from './api';
const empty={unread:0,orderIds:[],finance:{settlements:0,bank:0,wallet:0}};
const AttentionContext=createContext(empty);
export const useAttention=()=>useContext(AttentionContext);
export function AttentionDot({show=true,label='Có việc cần xử lý'}){
 return show?<span className="attention-dot" role="img" aria-label={label} title={label}/>:null;
}
export function AttentionProvider({user,children}){
 const [summary,setSummary]=useState(empty);
 useEffect(()=>{
  let alive=true,running=false,again=false;
  const controller=new AbortController();
  async function refresh(){
   if(running){again=true;return;}
   running=true;
   try{const r=await api('/attention-summary',{signal:controller.signal});if(alive)setSummary(r.data);}
   catch{}finally{running=false;if(again&&alive){again=false;refresh();}}
  }
  setSummary(empty);refresh();
  const timer=setInterval(refresh,10000);
  window.addEventListener('homefix:changed',refresh);
  window.addEventListener('focus',refresh);
  return ()=>{alive=false;controller.abort();clearInterval(timer);window.removeEventListener('homefix:changed',refresh);window.removeEventListener('focus',refresh);};
 },[user.id,user.role]);
 return <AttentionContext.Provider value={summary}>{children}</AttentionContext.Provider>;
}
export function needsAttention(summary,path){
 if(path==='/orders')return summary.orderIds.length>0;
 if(path==='/finance')return Object.values(summary.finance).some(n=>Number(n)>0);
 return false;
}
