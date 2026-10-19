// Fake speech sockets and PCM. No network, microphone or paid usage.
import {test} from 'node:test';import assert from 'node:assert/strict';import {connectLiveSpeech} from '../src/liveSpeech';import {afterPauseBoundary} from '../src/liveSpeechPause';
function fixture(t:any){const sockets:any[]=[],turns:any[]=[],failures:string[]=[];let customer:any,microphone:any;
 class Socket{static OPEN=1;readyState=0;bufferedAmount=0;onopen:any;onclose:any;onerror:any;onmessage:any;sent:any[]=[];constructor(){sockets.push(this);queueMicrotask(()=>{this.readyState=1;this.onopen?.();});}send(value:any){this.sent.push(value);}close(){this.readyState=3;this.onclose?.();}emit(value:any){this.onmessage?.({data:JSON.stringify(value)});}}
 t.mock.property(globalThis,'WebSocket',Socket);const abort=new AbortController();
 const sources={customerFrames:(receive:any)=>{customer=receive;return()=>{customer=null;};},microphoneFrames:(receive:any)=>{microphone=receive;return()=>{microphone=null;};}};
 return {sockets,turns,failures,sources,abort,customer:()=>customer,microphone:()=>microphone,connect:()=>connectLiveSpeech({capture:{},...sources,token:'fictional',signal:abort.signal,onTurn:async(speaker,text)=>{turns.push({speaker,text});},onCustomerSpeech:()=>{},onFailure:message=>failures.push(message)})};
}
const final=(text:string,start:number)=>({type:'Results',start,duration:.05,is_final:true,speech_final:true,channel:{alternatives:[{transcript:text,confidence:.95}]}});
test('Pause sends no audio, retains both sockets with KeepAlive, and repeated Resume reuses them',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const f=fixture(t),live=await f.connect();
 try{
  for(let n=0;n<20;n++)f.customer()(new ArrayBuffer(1600));const retired=f.customer();const bytes=f.sockets[0].sent.filter((r:any)=>r instanceof ArrayBuffer).length;
  f.sockets[0].emit({...final('Private unfinished fragment',.5),speech_final:false});live.pause();assert.equal(f.customer(),null);assert.equal(f.microphone(),null);
  f.sockets[0].emit(final('Late old question?',.9));t.mock.timers.tick(15000);assert.equal(f.sockets.length,2);assert.ok(f.sockets.every((s:any)=>s.readyState===1));assert.ok(f.sockets.every((s:any)=>s.sent.some((r:any)=>typeof r==='string'&&JSON.parse(r).type==='KeepAlive')));
  assert.equal(f.sockets[0].sent.filter((r:any)=>r instanceof ArrayBuffer).length,bytes);assert.deepEqual(f.turns,[]);assert.deepEqual(f.failures,[]);
  assert.equal(await live.resume(f.sources),true);retired(new ArrayBuffer(1600));assert.equal(f.sockets[0].sent.filter((r:any)=>r instanceof ArrayBuffer).length,bytes);
  f.customer()(new ArrayBuffer(1600));f.sockets[0].emit(final('Old result arriving after Resume?',.9));f.sockets[0].emit(final('Fresh question?',1));await Promise.resolve();await Promise.resolve();assert.deepEqual(f.turns,[{speaker:'customer',text:'Fresh question?'}]);
  for(let n=0;n<5;n++){live.pause();assert.equal(await live.resume(f.sources),true);}assert.equal(f.sockets.length,2);
 }finally{live.stop();f.abort.abort();}assert.ok(f.sockets.every((s:any)=>s.readyState===3));
});
test('a socket closed while paused stays paused and reports that Resume needs a new connection',async t=>{
 const f=fixture(t),live=await f.connect();live.pause();f.sockets[0].close();assert.equal(live.healthy(),false);assert.equal(await live.resume(f.sources),false);assert.equal(f.customer(),null);assert.equal(f.failures.length,1);live.stop();f.abort.abort();
});
test('mixed results across a pause retain only timestamped new words and never old private text',()=>{
 const mixed={...final('old private New question?',.8),channel:{alternatives:[{transcript:'old private New question?',confidence:.99,words:[{word:'old',start:.8,end:.9},{word:'private',start:.9,end:.99},{word:'New',start:1,end:1.1},{word:'question',punctuated_word:'question?',start:1.1,end:1.2}]}]}};
 assert.equal(afterPauseBoundary(mixed,1)?.channel.alternatives[0].transcript,'New question?');assert.equal(afterPauseBoundary(final('old un-timestamped words',.8),1),null);assert.equal(afterPauseBoundary({type:'UtteranceEnd',last_word_end:.9},1),null);
});
