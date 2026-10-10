// Simulated extension audio component; does not capture or transmit real audio.
import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
async function audio(){
 let listener:any,clock=0,interval:any,processor:any,held:any,delay=false;const sent:any[]=[],streams:any[]=[];
 const makeStream=()=>{const track={stopped:false,stop(){this.stopped=true;},addEventListener(){}};const stream={track,getTracks:()=>[track],getAudioTracks:()=>[track]};streams.push(stream);return stream;};
 class Node{connect(){}disconnect(){}}
 class Worklet extends Node{port:any={};constructor(){super();processor=this;}}
 class Context{destination=new Node();state='running';audioWorklet={addModule:async()=>{}};createMediaStreamSource(){return new Node();}async resume(){}async close(){this.state='closed';}}
 const chrome={runtime:{id:'fake-extension',onMessage:{addListener:(fn:any)=>listener=fn},sendMessage:async(m:any)=>{sent.push(m);return {};}}};
 const navigator={mediaDevices:{getUserMedia:async()=>delay?new Promise(resolve=>held=()=>resolve(makeStream())):makeStream()}};
 vm.runInNewContext(await readFile('extension/meet/audio.js','utf8'),{chrome,navigator,AudioContext:Context,AudioWorkletNode:Worklet,Uint8Array,btoa,Date,performance:{now:()=>clock},setInterval:(fn:any)=>{interval=fn;return 1;},clearInterval:()=>{interval=null;}});
 const send=(m:any)=>new Promise<any>(resolve=>listener({to:'audio',...m},{id:'fake-extension'},resolve));const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
 return {send,flush,sent,streams,frame:()=>processor.port.onmessage?.({data:new ArrayBuffer(1600)}),tick:async(ms:number)=>{clock=ms;interval?.();await flush();},delay:()=>delay=true,release:()=>held?.()};
}
test('audio watchdog shuts down unacknowledged capture and keeps current acknowledged frames live',async()=>{
 const h=await audio();assert.equal((await h.send({type:'start',runId:'test-run',streamId:'fake',deadline:Date.now()+60000})).ok,true);h.frame();assert.equal(h.sent[0].frame.length,2136);assert.equal(h.sent[0].sequence,1);
 await h.tick(4000);await h.send({type:'ack',runId:'test-run',sequence:1});await h.tick(8000);assert.equal(h.streams[0].track.stopped,false);
 await h.tick(10001);assert.equal(h.streams[0].track.stopped,true);assert.equal(h.sent.at(-1).type,'audio-ended');assert.match(h.sent.at(-1).message,/responding/);
});
test('Stop during audio permission request releases a stream delivered afterward',async()=>{
 const h=await audio();h.delay();const pending=h.send({type:'start',runId:'late-run',streamId:'fake',deadline:Date.now()+60000});await h.flush();await h.send({type:'stop'});h.release();assert.equal((await pending).ok,false);assert.equal(h.streams[0].track.stopped,true);assert.equal(h.sent.length,0);
});
test('expired or overlong audio sessions are rejected before microphone/tab access',async()=>{
 const h=await audio();for(const deadline of [Date.now()-1,Date.now()+3601000,NaN])assert.equal((await h.send({type:'start',runId:'expired',streamId:'fake',deadline})).ok,false);assert.equal(h.streams.length,0);
});
