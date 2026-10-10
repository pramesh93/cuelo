type PortEvent<T>={addListener:(fn:(event:T)=>void)=>void};
export type SignInPort={postMessage:(message:unknown)=>void;disconnect:()=>void;onMessage:PortEvent<{code?:string;error?:string}>;onDisconnect:PortEvent<void>};
export type SidebarChrome={runtime:{connect:(options:{name:string})=>SignInPort};storage:{onChanged?:{addListener:(listener:(changes:Record<string,{newValue?:unknown}>,area:string)=>void)=>void;removeListener:(listener:unknown)=>void};local:{get:(key:string)=>Promise<Record<string,unknown>>;set:(value:Record<string,string>)=>Promise<void>;remove:(key:string)=>Promise<void>}}};
export const chrome=(globalThis as unknown as {chrome:SidebarChrome}).chrome;
export function createTokenStorage(browser:Pick<SidebarChrome,'storage'>){return {getItem:async(key:string)=>{const saved=await browser.storage.local.get(key);return typeof saved[key]==='string'?saved[key] as string:null;},setItem:async(key:string,value:string)=>{await browser.storage.local.set({[key]:value});},removeItem:async(key:string)=>{await browser.storage.local.remove(key);}};}
export const storage=createTokenStorage(chrome);
export function googlePopup(redirect:string,nonce:string):Promise<string>{return new Promise((resolve,reject)=>{
 const port=chrome.runtime.connect({name:'cuelo-signin'});let ended=false;
 const ping=setInterval(()=>{if(!ended)try{port.postMessage({type:'ping'});}catch{finish(undefined,'Google sign-in disconnected.');}},10000);
 const timeout=setTimeout(()=>finish(undefined,'Google sign-in timed out. Try again.'),185000);
 function finish(code?:string,error?:string){if(ended)return;ended=true;clearInterval(ping);clearTimeout(timeout);port.disconnect();if(code)resolve(code);else reject(Error(error??'Google sign-in was cancelled.'));}
 port.onMessage.addListener(message=>finish(message.code,message.error));port.onDisconnect.addListener(()=>finish(undefined,'Google sign-in disconnected. Try again.'));
 try{port.postMessage({type:'signin',redirect,nonce});}catch{finish(undefined,'Google sign-in could not start.');}
 });}
export function randomNonce(){const bytes=crypto.getRandomValues(new Uint8Array(32));return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}

// Convex Auth listens for web storage events. Chrome extension storage uses a
// different event, so forward only current-environment credential changes.
export function syncRememberedSignIn(browser:{storage:{onChanged:{addListener:(listener:(changes:Record<string,{newValue?:unknown}>,area:string)=>void)=>void;removeListener:(listener:unknown)=>void}}},tokenStorage:unknown,target:{dispatchEvent:(event:Event)=>boolean},tokenKey:string){
 const listener=(changes:Record<string,{newValue?:unknown}>,area:string)=>{
  if(area!=='local'||!Object.hasOwn(changes,tokenKey))return;
  const value=changes[tokenKey].newValue;if(value!==undefined&&typeof value!=='string')return;
  const event=new Event('storage');Object.defineProperties(event,{storageArea:{value:tokenStorage},key:{value:tokenKey},newValue:{value:value??null}});target.dispatchEvent(event);
 };
 browser.storage.onChanged.addListener(listener);return()=>browser.storage.onChanged.removeListener(listener);
}
