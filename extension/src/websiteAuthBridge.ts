import {allowedWebsite} from '../../src/auth/sharedSession';
const browser=(globalThis as any).chrome,backend=import.meta.env.VITE_CONVEX_URL;
if(window===window.top&&allowedWebsite(location.origin,backend)){
 window.addEventListener('message',event=>{
  const m=event.data;
  if(event.source!==window||event.origin!==location.origin||m?.channel!=='cuelo-auth-request'||m.backend!==backend||typeof m.id!=='string'||!/^[a-f0-9]{32}$/.test(m.id))return;
  if(m.request?.operation==='probe'){window.postMessage({channel:'cuelo-auth-reply',id:m.id,backend,result:{state:{token:null,revision:-1,established:false}}},location.origin);return;}
  void browser.runtime.sendMessage({type:'shared-auth',backend,request:m.request}).then((result:any)=>window.postMessage({channel:'cuelo-auth-reply',id:m.id,backend,result},location.origin)).catch(()=>window.postMessage({channel:'cuelo-auth-reply',id:m.id,backend,result:{error:'Cuelo extension disconnected. Reload this page.'}},location.origin));
 });
 browser.runtime.onMessage.addListener((m:any)=>{
  if(m?.type==='shared-auth-changed'&&m.backend===backend)window.postMessage({channel:'cuelo-auth-changed',backend},location.origin);
 });
}
