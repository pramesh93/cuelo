// Real browser messages and DOM; simulated extension APIs/login records.
// All remote requests blocked. No Google automation, microphone or paid calls.
import {chromium} from 'playwright-core';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createSharedSession,type Stored} from '../src/auth/sharedSession';
const backend='https://calculating-gecko-263.convex.cloud';
let saved:Stored|null=null;
const token='example.'+btoa(JSON.stringify({sub:'fictional-browser-user|session'}))+'.example';
const service=createSharedSession({backend,load:async()=>saved,save:async s=>{saved=s;},legacy:async()=>null,validate:async()=>true,stopCall:async()=>{},call:async()=>({tokens:{token,refreshToken:'fictional-browser-refresh'}})});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 const context=await browser.newContext();
 await context.route('https://**/*',route=>route.abort());
 const page=await context.newPage();
 await page.addInitScript('window.__name = (fn) => fn;');
 await page.goto('http://127.0.0.1:5173/?view=live');
 await page.getByRole('heading',{name:'Use Cuelo in the Chrome sidebar.'}).waitFor();
 assert.equal(await page.getByRole('button',{name:/Prepare call|Connect call audio|Open floating card/}).count(),0);
 console.log('Real Chrome: old live URL shows sidebar instructions with no capture buttons.');
 // Reload with simulated extension installed; use the actual built content bridge.
 await context.route('http://127.0.0.1:5173/auth-bridge-check',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>SIMULATED shared sign-in</title><p>SIMULATED login; no provider connected.</p>'}));
 await page.goto('http://127.0.0.1:5173/auth-bridge-check');
 await page.exposeFunction('testAuthRequest',(m:any)=>service.run(m.request));
 await page.evaluate(()=>{
  (window as any).chrome={runtime:{sendMessage:(window as any).testAuthRequest,onMessage:{addListener:()=>{}}}};
 });
 await page.addScriptTag({content:await readFile('extension/meet/website-auth-bridge.js','utf8')});
 async function request(request:any){
  return page.evaluate(({backend,request})=>new Promise<any>((resolve,reject)=>{
   const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
   const timeout=setTimeout(()=>reject(Error('No bridge response')),3000);
   const receive=(event:MessageEvent)=>{if(event.data?.channel==='cuelo-auth-reply'&&event.data.id===id){clearTimeout(timeout);window.removeEventListener('message',receive);resolve(event.data.result);}};
   window.addEventListener('message',receive);window.postMessage({channel:'cuelo-auth-request',id,backend,request},location.origin);
  }),{backend,request});
 }
 assert.equal((await request({operation:'probe'})).state.revision,-1);
 const imported=await request({operation:'import',tokens:{token,refreshToken:'fictional-browser-refresh'}});
 assert.equal(imported.state.token,token);
 assert.equal((await service.run({operation:'state'})).state.token,token);
 await request({operation:'signOut'});
 assert.equal((await service.run({operation:'state'})).state.token,null);
 // Simulate a new sidebar login, then read it via the website's real message bridge.
 await service.run({operation:'signIn',args:{provider:'google',params:{redirectTo:'/?view=account'}}});
 assert.equal((await request({operation:'state'})).state.token,token);
 assert.equal('refreshToken' in (await request({operation:'state'})).state,false);
 console.log('Real Chrome messages with SIMULATED extension/login: both directions and logout pass; no refresh credential exposed.');
}finally{await browser.close();}
