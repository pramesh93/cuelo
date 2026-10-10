import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extensionTransport} from '../src/auth/transport';

test('hidden listening page loads shared login and receives updates using only Chrome runtime (simulated)',async()=>{
 const backend='https://calculating-gecko-263.convex.cloud';
 const previous=(globalThis as any).chrome;
 const listeners=new Set<(message:any,sender:any)=>void>();
 let updates=0;
 (globalThis as any).chrome={runtime:{id:'fictional-extension',sendMessage:async()=>({state:{token:'fictional-access',revision:1,established:true}}),onMessage:{addListener:(fn:any)=>listeners.add(fn),removeListener:(fn:any)=>listeners.delete(fn)}}};
 try{
  const transport=extensionTransport(backend),unsubscribe=transport.subscribe(()=>updates++);
  assert.equal((await transport.request({operation:'state'})).state.token,'fictional-access');
  for(const listener of listeners){
   listener({type:'shared-auth-changed',backend},{id:'foreign'});
   listener({type:'shared-auth-changed',backend:'https://deafening-frog-846.convex.cloud'},{id:'fictional-extension'});
   listener({type:'unrelated',backend},{id:'fictional-extension'});
  }
  assert.equal(updates,0);
  for(const listener of listeners)listener({type:'shared-auth-changed',backend},{id:'fictional-extension'});
  assert.equal(updates,1);unsubscribe();assert.equal(listeners.size,0);
 }finally{(globalThis as any).chrome=previous;}
});
