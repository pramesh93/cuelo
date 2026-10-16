// The tab stream stays inside the trusted offscreen document. No recording.
export async function prepareTabAudio(options:{streamId:string;signal:AbortSignal;onFrame:(frame:ArrayBuffer)=>void;onFailure:(message:string)=>void}){
 let active=true,streaming=false,stream:MediaStream|undefined,context:AudioContext|undefined,processor:AudioWorkletNode|undefined;
 const nodes:AudioNode[]=[];let timer:ReturnType<typeof setTimeout>|undefined;let cancelReady:(()=>void)|undefined;
 const ended=()=>{if(active){stop();options.onFailure('Meeting audio disconnected. Cuelo paused.');}};
 function stop(){if(!active)return;active=false;streaming=false;if(timer)clearTimeout(timer);cancelReady?.();options.signal.removeEventListener('abort',stop);if(processor)processor.port.onmessage=null;for(const track of stream?.getTracks()??[]){track.removeEventListener('ended',ended);track.stop();}for(const node of nodes){try{node.disconnect();}catch{}}void context?.close().catch(()=>{});}
 options.signal.addEventListener('abort',stop,{once:true});
 try{
  if(options.signal.aborted)throw new DOMException('Cancelled','AbortError');
  stream=await navigator.mediaDevices.getUserMedia({audio:{mandatory:{chromeMediaSource:'tab',chromeMediaSourceId:options.streamId}} as MediaTrackConstraints,video:false});
  if(!active){stream.getTracks().forEach(t=>t.stop());throw new DOMException('Cancelled','AbortError');}
  const tracks=stream.getAudioTracks();if(!tracks.length||tracks.some(t=>t.readyState!=='live'))throw Error('Chrome did not provide meeting audio. No listening started.');
  for(const track of tracks)track.addEventListener('ended',ended);
  context=new AudioContext();const source=context.createMediaStreamSource(stream);nodes.push(source);
  // Chrome redirects captured tab sound. Restore playback; OS speaker mute still applies.
  source.connect(context.destination);
  await context.audioWorklet.addModule((globalThis as any).chrome.runtime.getURL('meet-pcm.js'));
  if(!active)throw new DOMException('Cancelled','AbortError');
  processor=new AudioWorkletNode(context,'cuelo-live-pcm',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:'explicit'});nodes.push(processor);
  const silent=context.createGain();silent.gain.value=0;nodes.push(silent);source.connect(processor);processor.connect(silent);silent.connect(context.destination);
  await new Promise<void>((resolve,reject)=>{
   cancelReady=()=>reject(new DOMException('Cancelled','AbortError'));
   timer=setTimeout(()=>reject(Error('Chrome could not process meeting audio. No listening started.')),3000);
   processor!.port.onmessage=(event:MessageEvent<ArrayBuffer>)=>{if(!active)return;if(event.data?.byteLength!==1600){reject(Error('Unreadable meeting audio.'));ended();return;}clearTimeout(timer);cancelReady=undefined;resolve();if(streaming)options.onFrame(event.data);};
   void context!.resume().then(()=>{if(context!.state!=='running')reject(Error('Chrome could not activate meeting audio.'));}).catch(reject);
  });
  if(!active)throw new DOMException('Cancelled','AbortError');
  return {stop,start:()=>{if(!active)throw Error('Meeting audio stopped.');streaming=true;},tracks:tracks.length};
 }catch(error){stop();throw error;}
}
