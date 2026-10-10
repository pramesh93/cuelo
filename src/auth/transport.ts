import {sessionKey,type AuthRequest,type AuthResult} from './sharedSession';
export type Transport={request:(request:AuthRequest)=>Promise<AuthResult>;subscribe:(listener:()=>void)=>()=>void};
export function extensionTransport(backend:string):Transport{
 const browser=(globalThis as any).chrome;
 return {
  request:async request=>{const result=await browser.runtime.sendMessage({type:'shared-auth',backend,request});if(result?.error)throw Error(result.error);if(!result?.state)throw Error('Shared sign-in is unavailable. Reload Cuelo.');return result;},
  subscribe:listener=>{const changed=(changes:any,area:string)=>{if(area==='local'&&changes[sessionKey(backend)])listener();};browser.storage.onChanged.addListener(changed);return()=>browser.storage.onChanged.removeListener(changed);},
 };
}
export function websiteTransport(backend:string):Transport{
 return {
  request:request=>new Promise((resolve,reject)=>{
   const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
   const timer=setTimeout(()=>{window.removeEventListener('message',receive);reject(Error(request.operation==='probe'?'Cuelo extension did not respond. Reload this page.':'Shared sign-in is busy or disconnected. Reload this page.'));},request.operation==='probe'?1200:30000);
   function receive(event:MessageEvent){const m=event.data;if(event.source!==window||event.origin!==location.origin||m?.channel!=='cuelo-auth-reply'||m.id!==id||m.backend!==backend)return;clearTimeout(timer);window.removeEventListener('message',receive);if(m.result?.error)reject(Error(m.result.error));else resolve(m.result);}
   window.addEventListener('message',receive);window.postMessage({channel:'cuelo-auth-request',id,backend,request},location.origin);
  }),
  subscribe:listener=>{const changed=(event:MessageEvent)=>{if(event.source===window&&event.origin===location.origin&&event.data?.channel==='cuelo-auth-changed'&&event.data.backend===backend)listener();};window.addEventListener('message',changed);return()=>window.removeEventListener('message',changed);},
 };
}
