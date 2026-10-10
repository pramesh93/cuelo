// Simulated sockets and audio graph. No provider or real microphone/Meet audio.
import {test} from 'node:test';import assert from 'node:assert/strict';import {connectLiveSpeech} from '../src/liveSpeech';
test('extension PCM uses customer channel while microphone speech remains context; Stop releases both',async()=>{
 const sockets:FakeSocket[]=[],contexts:FakeContext[]=[];
 class FakeSocket {static OPEN=1;readyState=0;bufferedAmount=0;onopen:any;onerror:any;onclose:any;onmessage:any;sent:unknown[]=[];constructor(public url:string,public protocols:string[]){sockets.push(this);queueMicrotask(()=>{this.readyState=1;this.onopen?.();});}send(value:unknown){this.sent.push(value);}close(){this.readyState=3;this.onclose?.();}emit(value:unknown){this.onmessage?.({data:JSON.stringify(value)});}}
 class Node {connect(){}disconnect(){}}
 class Worklet extends Node {port:{onmessage:any}={onmessage:null};}
 class FakeContext {state='running';closed=false;destination=new Node();audioWorklet={addModule:async()=>{}};constructor(){contexts.push(this);}createMediaStreamSource(){return new Node();}async resume(){}async close(){this.closed=true;}}
 const replacements={WebSocket:FakeSocket,AudioContext:FakeContext,AudioWorkletNode:Worklet};const previous=new Map<string,PropertyDescriptor|undefined>();for(const [key,value] of Object.entries(replacements)){previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});}
 const abort=new AbortController();let receiver:((frame:ArrayBuffer)=>void)|null=null,microphoneReceiver:((frame:ArrayBuffer)=>void)|null=null,unsubscribed=0,customerStarts=0;const turns:Array<{speaker:string;text:string}>=[],failures:string[]=[];
 try{const live=await connectLiveSpeech({capture:{},microphoneFrames:callback=>{microphoneReceiver=callback;return()=>{microphoneReceiver=null;unsubscribed++;};},customerFrames:callback=>{receiver=callback;return()=>{receiver=null;unsubscribed++;};},workletURL:'fake-worklet',token:'fake-token',signal:abort.signal,onCustomerSpeech:()=>customerStarts++,onTurn:async(speaker,text)=>{turns.push({speaker,text});},onFailure:message=>failures.push(message)});
 assert.equal(sockets.length,2);assert.equal(contexts.length,0,'both Meet-page inputs arrive as PCM; extension microphone permission is never requested');assert.ok(sockets.every(s=>s.protocols[0]==='bearer'&&new URL(s.url).searchParams.get('mip_opt_out')==='true'));
 receiver!(new ArrayBuffer(1600));assert.equal((sockets[0].sent[0] as ArrayBuffer).byteLength,1600);assert.equal(sockets[1].sent.length,0);microphoneReceiver!(new ArrayBuffer(1600));assert.equal((sockets[1].sent[0] as ArrayBuffer).byteLength,1600);
 const final=(text:string)=>({type:'Results',start:0,is_final:true,speech_final:true,channel:{alternatives:[{transcript:text,confidence:.95}]}});
 sockets[1].emit(final('Our example includes a setup checklist.'));await new Promise(resolve=>setTimeout(resolve,0));assert.equal(customerStarts,0);assert.equal(turns[0].speaker,'salesperson');
 sockets[0].emit(final('Does the example include setup help?'));await new Promise(resolve=>setTimeout(resolve,0));assert.equal(customerStarts,1);assert.equal(turns[1].speaker,'customer');
 abort.abort();live.stop();assert.equal(unsubscribed,2);assert.equal(receiver,null);assert.equal(microphoneReceiver,null);assert.ok(contexts.every(c=>c.closed));assert.ok(sockets.every(s=>s.readyState===3));assert.deepEqual(failures,[]);
 }finally{abort.abort();for(const [key,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}
});
