// Simulated Chrome windows/events. No browser launch or live Google request.
import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
// @ts-expect-error browser-only JavaScript module.
import {checkAuthStart,authReturn} from '../extension/meet/auth-policy.js';
function event(){let fn:any=()=>{};return {addListener:(listener:any)=>fn=listener,fire:(...args:any[])=>fn(...args)};}
async function worker(){const connect=event(),action=event(),updated=event(),removed=event(),messages=event(),disconnected=event();const created:any[]=[],closed:number[]=[],sent:any[]=[],timers=new Map<number,()=>void>();let timerCount=0,late:any,hold=false,initialReturn:string|undefined;
 const chrome={storage:{local:{setAccessLevel:async()=>{}}},runtime:{getURL:(file:string)=>`chrome-extension://example/${file}`,onConnect:connect},action:{onClicked:action},sidePanel:{open:async()=>{}},windows:{onRemoved:removed,create:async(options:any)=>{created.push(options);return hold?new Promise(resolve=>late=()=>resolve({id:71})):{id:71};},remove:async(id:number)=>{closed.push(id);}},tabs:{onUpdated:updated,query:async()=>initialReturn?[{url:initialReturn,windowId:71}]:[],create:()=>{throw Error('A normal tab must never open.');}}};
 const authConfig={siteOrigin:'https://calculating-gecko-263.convex.site',returnOrigin:'http://127.0.0.1:5173'};
 const source=(await readFile('extension/meet/auth-worker.js','utf8')).replace(/^import .*;\n/gm,'');vm.runInNewContext(source,{chrome,authConfig,checkAuthStart,authReturn,setTimeout:(fn:()=>void)=>{const id=++timerCount;timers.set(id,fn);return id;},clearTimeout:(id:number)=>timers.delete(id)});
 const port={name:'cuelo-signin',sender:{url:chrome.runtime.getURL('auth-check.html')},onMessage:messages,onDisconnect:disconnected,disconnect:()=>{},postMessage:(message:any)=>sent.push(message)};connect.fire(port);
 const flush=()=>new Promise(resolve=>setTimeout(resolve,0));const nonce='b'.repeat(64);const begin=()=>messages.fire({type:'signin',nonce,redirect:`${authConfig.siteOrigin}/api/auth/signin/google?code=fake-start`});
 return {created,closed,sent,timers,begin,flush,messages,disconnected,updated,nonce,callback:`${authConfig.returnOrigin}/?view=extension-auth&state=${nonce}&code=fake-final`,hold:()=>hold=true,release:()=>late?.(),initial:(url:string)=>initialReturn=url};}
test('sign-in opens only a popup, accepts only its matching return and closes the popup',async()=>{const h=await worker();h.begin();await h.flush();assert.equal(h.created.length,1);assert.equal(h.created[0].type,'popup');
 h.updated.fire(10,{url:h.callback},{windowId:99});await h.flush();assert.equal(h.sent.length,0);
 h.updated.fire(10,{url:h.callback.replace(h.nonce,'wrong')},{windowId:71});await h.flush();assert.equal(h.sent.length,0);
 h.updated.fire(10,{url:h.callback},{windowId:71});await h.flush();assert.equal(h.sent[0].code,'fake-final');assert.deepEqual(h.closed,[71]);assert.equal(h.timers.size,0);
});
test('an immediate redirect is collected even if it arrives before window creation finishes',async()=>{const h=await worker();h.initial(h.callback);h.begin();await h.flush();assert.equal(h.sent[0].code,'fake-final');assert.deepEqual(h.closed,[71]);assert.equal(h.timers.size,0);});
test('closing sidebar during popup creation cancels and releases the late window',async()=>{const h=await worker();h.hold();h.begin();await h.flush();h.disconnected.fire();await h.flush();h.release();await h.flush();assert.deepEqual(h.closed,[71]);assert.equal(h.timers.size,0);assert.match(h.sent[0].error,/sidebar closed/);});
test('invalid starts fail without any window or hanging sign-in request',async()=>{const h=await worker();h.messages.fire({type:'signin',nonce:h.nonce,redirect:'https://example.com/'});await h.flush();assert.equal(h.created.length,0);assert.equal(h.timers.size,0);assert.match(h.sent[0].error,/safely/);});
