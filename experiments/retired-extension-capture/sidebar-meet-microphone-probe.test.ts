// Simulated browser APIs only; this does not prove Meet-origin microphone access.
import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
async function probe(permission:string,options:{trusted?:boolean;joined?:boolean;late?:boolean}={}){
 let listener:any,requests=0,stops=0,timer:any,resolveStream:any;const stream={getAudioTracks:()=>[{readyState:'live'}],getTracks:()=>[{stop:()=>{stops++;}}]};
 vm.runInNewContext(await readFile('extension/meet/microphone-probe.js','utf8'),{chrome:{runtime:{id:'cuelo',onMessage:{addListener:(f:any)=>{listener=f;}}}},document:{},location:{pathname:'/abc-defg-hij'},cueloProbeMeetingState:()=>options.joined===false?'waiting':'joined',navigator:{permissions:{query:async()=>({state:permission})},mediaDevices:{getUserMedia:async()=>{requests++;return options.late?await new Promise(r=>{resolveStream=r;}):stream;}}},setTimeout:(f:any)=>{timer=f;return 1;},clearTimeout:()=>{}});
 const result=new Promise<any>(r=>{if(!listener({type:'cuelo-microphone-probe'},{id:options.trusted===false?'other':'cuelo'},r))r(undefined);});
 return {result,requests:()=>requests,stops:()=>stops,timeout:()=>timer(),release:()=>resolveStream(stream)};
}
test('unpaid probe never requests a new microphone permission and rejects other extensions or a lobby',async()=>{
 for(const state of ['prompt','denied']){const h=await probe(state);assert.equal((await h.result).microphone,state);assert.equal(h.requests(),0);}
 const foreign=await probe('granted',{trusted:false});assert.equal(await foreign.result,undefined);assert.equal(foreign.requests(),0);
 const lobby=await probe('granted',{joined:false});assert.equal((await lobby.result).microphone,'not-in-meeting');assert.equal(lobby.requests(),0);
});
test('existing Meet permission probe immediately releases its microphone',async()=>{const h=await probe('granted');assert.equal((await h.result).microphone,'existing-permission-works');assert.equal(h.requests(),1);assert.equal(h.stops(),1);});
test('microphone arriving after a probe timeout is still stopped',async()=>{const h=await probe('granted',{late:true});await new Promise(r=>setTimeout(r,0));h.timeout();assert.equal((await h.result).microphone,'timed-out');h.release();await new Promise(r=>setTimeout(r,0));assert.equal(h.stops(),1);});
