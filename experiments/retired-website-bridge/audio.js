// Ephemeral PCM forwarding; no recording or stored audio. Playback restores Meet sound.
let stream,context,processor,input,watchdog,revision=0,runId=null,lastAck=0,sequence=0;
async function stop(){revision++;clearInterval(watchdog);watchdog=null;if(processor){processor.port.onmessage=null;processor.disconnect();}input?.disconnect();stream?.getTracks().forEach(t=>t.stop());stream=null;const old=context;context=null;processor=null;input=null;runId=null;if(old)await old.close().catch(()=>{});}
async function fail(message){const id=runId;await stop();if(id)void chrome.runtime.sendMessage({type:'audio-ended',runId:id,message}).catch(()=>{});}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(m.to!=='audio'||sender.id!==chrome.runtime.id)return;
 let ownRevision=null;
 (async()=>{
  if(m.type==='stop'){await stop();return {ok:true};}
  if(m.type==='ack'){if(m.runId===runId&&Number.isInteger(m.sequence)&&m.sequence<=sequence)lastAck=performance.now();return {ok:true};}
  if(m.type!=='start'||typeof m.runId!=='string'||!Number.isFinite(m.deadline)||m.deadline<=Date.now()||m.deadline>Date.now()+3600000)throw Error('Invalid audio start.');
  await stop();const run=revision;ownRevision=run;runId=m.runId;
  const captured=await navigator.mediaDevices.getUserMedia({audio:{mandatory:{chromeMediaSource:'tab',chromeMediaSourceId:m.streamId}},video:false});
  if(run!==revision){captured.getTracks().forEach(t=>t.stop());throw Error('Audio startup cancelled.');}stream=captured;
  context=new AudioContext({sampleRate:16000});const ctx=context;await ctx.audioWorklet.addModule('call-stream.js');if(run!==revision)throw Error('Audio startup cancelled.');
  input=ctx.createMediaStreamSource(stream);processor=new AudioWorkletNode(ctx,'cuelo-live-pcm',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:'explicit'});
  input.connect(ctx.destination);input.connect(processor);processor.connect(ctx.destination);
  lastAck=performance.now();sequence=0;
  processor.port.onmessage=event=>{if(run!==revision)return;const bytes=new Uint8Array(event.data);if(bytes.length!==1600){void fail('Audio format changed. Cuelo stopped.');return;}let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);void chrome.runtime.sendMessage({type:'pcm',runId,sequence:++sequence,frame:btoa(binary)}).catch(()=>{void fail('Cuelo connection lost.');});};
  stream.getAudioTracks().forEach(track=>track.addEventListener('ended',()=>{if(run===revision)void fail('Meeting audio disconnected.');},{once:true}));
  watchdog=setInterval(()=>{if(run!==revision)return;if(Date.now()>=m.deadline)void fail('The 60-minute limit was reached.');else if(performance.now()-lastAck>5000)void fail('Cuelo stopped responding. Audio stopped.');else if(ctx.state!=='running')void fail('Audio processing stopped.');},1000);
  await ctx.resume();if(run!==revision)throw Error('Audio startup cancelled.');return {ok:true};
 })().then(reply).catch(()=>{if(ownRevision===revision)void stop();reply({ok:false});});return true;
});
