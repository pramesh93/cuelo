import {createUtteranceAssembler} from './liveTranscript';
export type LiveSpeech={stop:()=>void};
export async function connectLiveSpeech(options:{capture:{microphone?:MediaStream;meeting?:MediaStream};microphoneFrames?:(receive:(frame:ArrayBuffer)=>void)=>()=>void;customerFrames?:(receive:(frame:ArrayBuffer)=>void)=>()=>void;workletURL?:string;token:string;signal:AbortSignal;onTurn:(speaker:'customer'|'salesperson',text:string)=>Promise<void>;onCustomerSpeech:()=>void;onFailure:(message:string)=>void}):Promise<LiveSpeech>{
 const sockets:WebSocket[]=[],contexts:AudioContext[]=[],nodes:AudioNode[]=[];const timers:Array<ReturnType<typeof setTimeout>>=[];let stopped=false,queue=Promise.resolve(),queued=0;const removeFrames:Array<()=>void>=[];
 const stop=()=>{if(stopped)return;stopped=true;removeFrames.splice(0).forEach(remove=>remove());options.signal.removeEventListener('abort',stop);for(const timer of timers)clearTimeout(timer);for(const ws of sockets){ws.onmessage=null;ws.onclose=null;ws.onerror=null;ws.onopen=null;try{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'CloseStream'}));ws.close(1000,'Cuelo stopped');}catch{}}for(const node of nodes){if(node instanceof AudioWorkletNode)node.port.onmessage=null;node.disconnect();}for(const ctx of contexts)void ctx.close().catch(()=>{});};
 const fail=(message:string)=>{if(stopped)return;stop();options.onFailure(message);};
 options.signal.addEventListener('abort',stop,{once:true});
 try{
  if(options.signal.aborted)throw new DOMException('Stopped','AbortError');
  const params=new URLSearchParams({model:'nova-3',language:'en',encoding:'linear16',sample_rate:'16000',channels:'1',interim_results:'true',endpointing:'300',utterance_end_ms:'1000',vad_events:'true',smart_format:'true',mip_opt_out:'true'});
  for(const [speaker,stream] of [['customer',options.capture.meeting],['salesperson',options.capture.microphone]] as const){
   if(stopped)throw new DOMException('Stopped','AbortError');
   const ws=new WebSocket(`wss://api.deepgram.com/v1/listen?${params}`,['bearer',options.token]);sockets.push(ws);
   const assemble=createUtteranceAssembler({speaker,onCustomerSpeech:()=>{if(!stopped)options.onCustomerSpeech();},onFailure:fail,onTurn:text=>{
    if(stopped)return;if(++queued>20){fail('Cuelo could not keep up with the call. Listening stopped; reconnect when your connection recovers.');return;}
    queue=queue.then(async()=>{if(!stopped)await options.onTurn(speaker,text);}).catch(()=>{fail('Your call text could not reach Cuelo. Listening stopped.');}).finally(()=>{queued--;});
   }});
   ws.onmessage=event=>{if(stopped)return;if(typeof event.data!=='string'||event.data.length>65536){fail('Speech recognition sent an unreadable response. Cuelo stopped.');return;}try{const message=JSON.parse(event.data);if(message.type==='Error'){fail('Speech recognition failed. Cuelo stopped; try again later.');return;}assemble(message);}catch{fail('Speech recognition sent an unreadable response. Cuelo stopped.');}};
   await new Promise<void>((resolve,reject)=>{
    const timeout=setTimeout(()=>{reject(new Error('Speech recognition took too long to connect.'));},10000);timers.push(timeout);
    const cancel=()=>reject(new DOMException('Stopped','AbortError'));options.signal.addEventListener('abort',cancel,{once:true});
    const finish=()=>{clearTimeout(timeout);options.signal.removeEventListener('abort',cancel);};
    ws.onopen=()=>{finish();resolve();};ws.onerror=()=>{finish();reject(new Error('Speech recognition could not connect.'));fail('Speech recognition disconnected. Cuelo stopped.');};ws.onclose=()=>{finish();reject(new Error('Speech recognition disconnected.'));fail('Speech recognition disconnected. Cuelo stopped.');};
   });
   if(stopped)throw new DOMException('Stopped','AbortError');
   const externalFrames=speaker==='customer'?options.customerFrames:options.microphoneFrames;
   if(externalFrames){
    let lastFrame=performance.now();removeFrames.push(externalFrames(frame=>{if(stopped)return;lastFrame=performance.now();if(frame.byteLength!==1600||ws.readyState!==WebSocket.OPEN||ws.bufferedAmount>128000){fail(speaker==='customer'?'Meeting audio could not reach speech recognition. Cuelo stopped.':'Microphone audio could not reach speech recognition. Cuelo stopped.');return;}ws.send(frame);}));
    const check=()=>{if(stopped)return;if(performance.now()-lastFrame>10000){fail(speaker==='customer'?'Meeting audio disconnected. Cuelo stopped.':'Microphone audio disconnected. Cuelo stopped.');return;}timers.push(setTimeout(check,3000));};timers.push(setTimeout(check,3000));continue;
   }
   if(!stream)throw new Error('Meeting audio is missing.');
   const context=new AudioContext({sampleRate:16000});contexts.push(context);await context.audioWorklet.addModule(options.workletURL??`${import.meta.env.BASE_URL}call-stream.js`);
   if(stopped)throw new DOMException('Stopped','AbortError');
   const source=context.createMediaStreamSource(stream);const processor=new AudioWorkletNode(context,'cuelo-live-pcm',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:'explicit'});nodes.push(source,processor);
   let lastFrame=performance.now();processor.port.onmessage=(event:MessageEvent<ArrayBuffer>)=>{if(stopped)return;lastFrame=performance.now();if(ws.readyState!==WebSocket.OPEN||ws.bufferedAmount>128000){fail('The speech connection could not keep up. Cuelo stopped.');return;}ws.send(event.data);};
   source.connect(processor);processor.connect(context.destination);await context.resume();
   const check=()=>{if(stopped)return;if(context.state!=='running'||performance.now()-lastFrame>10000){fail('Audio processing stopped. Cuelo stopped; reconnect the call audio.');return;}timers.push(setTimeout(check,3000));};timers.push(setTimeout(check,3000));
  }
  if(stopped)throw new DOMException('Stopped','AbortError');return {stop};
 }catch(error){stop();throw error;}
}
