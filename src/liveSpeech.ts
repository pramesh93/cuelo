import {createUtteranceAssembler} from './liveTranscript';
import {afterPauseBoundary} from './liveSpeechPause';
type Frames=(receive:(frame:ArrayBuffer)=>void)=>()=>void;
export type SpeechFrames={customerFrames?:Frames;microphoneFrames?:Frames};
export type LiveSpeech={stop:()=>void;pause:()=>void;resume:(frames?:SpeechFrames)=>Promise<boolean>;healthy:()=>boolean};
export async function connectLiveSpeech(options:{capture:{microphone?:MediaStream;meeting?:MediaStream};microphoneFrames?:Frames;customerFrames?:Frames;workletURL?:string;token:string;signal:AbortSignal;onTurn:(speaker:'customer'|'salesperson',text:string)=>Promise<void>;onCustomerSpeech:()=>void;onFailure:(message:string)=>void}):Promise<LiveSpeech>{
 type Wire={ws:WebSocket;speaker:'customer'|'salesperson';sentFrames:number;floor:number;lastFrame:number;external:boolean;unsubscribe?:()=>void;assemble:ReturnType<typeof createUtteranceAssembler>};
 const wires:Wire[]=[],contexts:AudioContext[]=[],nodes:AudioNode[]=[],timers=new Set<ReturnType<typeof setTimeout>>();let stopped=false,paused=false,version=0,queue=Promise.resolve(),queued=0;
 const later=(fn:()=>void,ms:number)=>{const timer=setTimeout(()=>{timers.delete(timer);fn();},ms);timers.add(timer);return timer;};
 const healthy=()=>!stopped&&wires.length===2&&wires.every(w=>w.ws.readyState===WebSocket.OPEN&&w.ws.bufferedAmount<=128000);
 const stop=()=>{if(stopped)return;stopped=true;version++;options.signal.removeEventListener('abort',stop);for(const timer of timers)clearTimeout(timer);timers.clear();for(const w of wires){w.unsubscribe?.();w.unsubscribe=undefined;const ws=w.ws;ws.onmessage=null;ws.onclose=null;ws.onerror=null;ws.onopen=null;try{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'CloseStream'}));ws.close(1000,'Cuelo stopped');}catch{}}for(const node of nodes){if(node instanceof AudioWorkletNode)node.port.onmessage=null;node.disconnect();}for(const ctx of contexts)void ctx.close().catch(()=>{});};
 const fail=(message:string)=>{if(stopped)return;stop();options.onFailure(message);};
 const assembler=(speaker:'customer'|'salesperson')=>createUtteranceAssembler({speaker,onCustomerSpeech:()=>{if(!stopped&&!paused)options.onCustomerSpeech();},onFailure:fail,onTurn:text=>{
  if(stopped||paused)return;const at=version;if(++queued>20){fail('Cuelo could not keep up with the call. Listening stopped; reconnect when your connection recovers.');return;}
  queue=queue.then(async()=>{if(!stopped&&!paused&&at===version)await options.onTurn(speaker,text);}).catch(()=>{if(at===version&&!paused)fail('Your call text could not reach Cuelo. Listening stopped.');}).finally(()=>{queued--;});
 }});
 const send=(w:Wire,frame:ArrayBuffer)=>{if(stopped||paused)return;w.lastFrame=performance.now();if(frame.byteLength!==1600||w.ws.readyState!==WebSocket.OPEN||w.ws.bufferedAmount>128000){fail(w.speaker==='customer'?'Meeting audio could not reach speech recognition. Cuelo stopped.':'Microphone audio could not reach speech recognition. Cuelo stopped.');return;}try{w.ws.send(frame);w.sentFrames++;}catch{fail('Speech recognition disconnected. Cuelo paused.');}};
 const attach=(w:Wire,source:Frames)=>{w.unsubscribe?.();const attached=version;w.unsubscribe=source(frame=>{if(attached===version)send(w,frame);});w.lastFrame=performance.now();};
 const pause=()=>{if(stopped||paused)return;paused=true;version++;for(const w of wires){w.unsubscribe?.();w.unsubscribe=undefined;w.floor=w.sentFrames/20;w.assemble=assembler(w.speaker);try{if(w.ws.readyState===WebSocket.OPEN)w.ws.send(JSON.stringify({type:'Finalize'}));}catch{fail('Speech recognition disconnected. Cuelo paused.');}}for(const context of contexts)void context.suspend().catch(()=>{});};
 const resume=async(frames:SpeechFrames=options)=>{if(!paused)return healthy();if(!healthy())return false;try{
  for(const w of wires){w.lastFrame=performance.now();if(w.external){const source=w.speaker==='customer'?frames.customerFrames:frames.microphoneFrames;if(!source)return false;}}
  version++;paused=false;for(const w of wires)if(w.external)attach(w,(w.speaker==='customer'?frames.customerFrames:frames.microphoneFrames)!);for(const context of contexts)await context.resume();return healthy();
 }catch{pause();return false;}};
 options.signal.addEventListener('abort',stop,{once:true});
 try{
  if(options.signal.aborted)throw new DOMException('Stopped','AbortError');
  const params=new URLSearchParams({model:'nova-3',language:'en',encoding:'linear16',sample_rate:'16000',channels:'1',interim_results:'true',endpointing:'300',utterance_end_ms:'1000',vad_events:'true',smart_format:'true',mip_opt_out:'true'});
  for(const [speaker,stream] of [['customer',options.capture.meeting],['salesperson',options.capture.microphone]] as const){
   if(stopped)throw new DOMException('Stopped','AbortError');
   const ws=new WebSocket(`wss://api.deepgram.com/v1/listen?${params}`,['bearer',options.token]);const source=speaker==='customer'?options.customerFrames:options.microphoneFrames;
   const w:Wire={ws,speaker,sentFrames:0,floor:0,lastFrame:performance.now(),external:!!source,assemble:assembler(speaker)};wires.push(w);
   ws.onmessage=event=>{if(stopped)return;if(typeof event.data!=='string'||event.data.length>65536){fail('Speech recognition sent an unreadable response. Cuelo stopped.');return;}try{const message=JSON.parse(event.data);if(message.type==='Error'){fail('Speech recognition failed. Cuelo paused; try Resume.');return;}if(paused)return;const fresh=afterPauseBoundary(message,w.floor);if(fresh)w.assemble(fresh);}catch{fail('Speech recognition sent an unreadable response. Cuelo stopped.');}};
   await new Promise<void>((resolve,reject)=>{
    const timeout=later(()=>reject(new Error('Speech recognition took too long to connect.')),10000);
    const cancel=()=>reject(new DOMException('Stopped','AbortError'));options.signal.addEventListener('abort',cancel,{once:true});
    const finish=()=>{clearTimeout(timeout);timers.delete(timeout);options.signal.removeEventListener('abort',cancel);};
    ws.onopen=()=>{finish();resolve();};ws.onerror=()=>{finish();reject(new Error('Speech recognition could not connect.'));fail('Speech recognition disconnected. Cuelo paused.');};ws.onclose=()=>{finish();reject(new Error('Speech recognition disconnected.'));fail('Speech recognition disconnected. Cuelo paused.');};
   });
   if(stopped)throw new DOMException('Stopped','AbortError');
   if(source)attach(w,source);
   else{
    if(!stream)throw new Error('Meeting audio is missing.');const context=new AudioContext({sampleRate:16000});contexts.push(context);await context.audioWorklet.addModule(options.workletURL??`${import.meta.env.BASE_URL}call-stream.js`);if(stopped)throw new DOMException('Stopped','AbortError');
    const input=context.createMediaStreamSource(stream),processor=new AudioWorkletNode(context,'cuelo-live-pcm',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:'explicit'});nodes.push(input,processor);processor.port.onmessage=(event:MessageEvent<ArrayBuffer>)=>send(w,event.data);input.connect(processor);processor.connect(context.destination);await context.resume();
   }
   const check=()=>{if(stopped)return;if(!paused&&performance.now()-w.lastFrame>10000){fail(speaker==='customer'?'Meeting audio disconnected. Cuelo paused.':'Microphone audio disconnected. Cuelo paused.');return;}later(check,3000);};later(check,3000);
  }
  const keepAlive=()=>{if(stopped)return;if(paused)for(const w of wires){if(w.ws.readyState!==WebSocket.OPEN||w.ws.bufferedAmount>128000){fail('Speech recognition disconnected while paused. Resume to reconnect.');return;}try{w.ws.send(JSON.stringify({type:'KeepAlive'}));}catch{fail('Speech recognition disconnected while paused. Resume to reconnect.');return;}}later(keepAlive,3000);};later(keepAlive,3000);
  if(stopped)throw new DOMException('Stopped','AbortError');return {stop,pause,resume,healthy};
 }catch(error){stop();throw error;}
}
