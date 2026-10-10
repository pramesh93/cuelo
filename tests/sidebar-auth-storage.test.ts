import {test} from 'node:test';import assert from 'node:assert/strict';import {createTokenStorage} from '../extension/src/chrome';import {decodeMeetingFrame,validExtensionId} from '../src/extensionProtocol';
test('remembered login survives recreating sidebar storage and sign-out removes saved credentials (simulated)',async()=>{
 const saved:Record<string,unknown>={};const browser={storage:{local:{get:async(key:string)=>({[key]:saved[key]}),set:async(value:Record<string,string>)=>{Object.assign(saved,value);},remove:async(key:string)=>{delete saved[key];}}}};
 const first=createTokenStorage(browser);await first.setItem('fake-session','fake-token');await first.setItem('fake-refresh','fake-refresh-token');
 const reopened=createTokenStorage(browser);assert.equal(await reopened.getItem('fake-session'),'fake-token');assert.equal(await reopened.getItem('fake-refresh'),'fake-refresh-token');
 await reopened.removeItem('fake-session');await reopened.removeItem('fake-refresh');assert.equal(await first.getItem('fake-session'),null);assert.equal(await first.getItem('fake-refresh'),null);
});
test('meeting frame and extension address checks retain strict input boundaries',()=>{assert.equal(decodeMeetingFrame(btoa('\0'.repeat(1600))).byteLength,1600);for(const value of [null,{},'a'.repeat(2136),btoa('\0'.repeat(1599)),btoa('\0'.repeat(1601))])assert.throws(()=>decodeMeetingFrame(value));assert.equal(validExtensionId('a'.repeat(32)),true);assert.equal(validExtensionId('https://example.com'),false);});

test('sidebar receives remembered login renewal and removal from other extension contexts (simulated)',async()=>{
 const {syncRememberedSignIn}=await import('../extension/src/chrome');let listener:any;let removed=false;const events:any[]=[];const tokenStorage={};
 const cleanup=syncRememberedSignIn({storage:{onChanged:{addListener:f=>{listener=f;},removeListener:f=>{removed=f===listener;}}}},tokenStorage,{dispatchEvent:e=>{events.push(e);return true;}},'test-login');
 listener({'production-login':{newValue:'fake-other-environment'}},'local');listener({'test-login':{newValue:'fake-value'}},'session');assert.equal(events.length,0);
 listener({'test-login':{newValue:'fake-renewed'}},'local');assert.equal(events[0].storageArea,tokenStorage);assert.equal(events[0].key,'test-login');assert.equal(events[0].newValue,'fake-renewed');
 listener({'test-login':{}},'local');assert.equal(events[1].newValue,null);cleanup();assert.equal(removed,true);
});
