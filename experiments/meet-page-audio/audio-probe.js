// Local audio meters only. No recordings, raw-audio messages or provider calls.
// Reads public media-element properties; never patches Meet/WebRTC internals.
globalThis.CueloMeetAudioProbe=class {
 constructor(env){this.env=env;this.state='idle';this.message='Audio is off.';this.revision=0;this.inputs=new Map();this.microphone=null;this.context=null;this.timer=null;this.deadline=0;this.deadlineMono=0;this.warning=false;}
 joined(){return this.env.meeting()==='joined';}
 micEnabled(){return this.env.microphoneState()==='unmuted';}
 detach(input){input.source.disconnect();input.analyser.disconnect();input.clone.stop();}
 release(){if(this.timer!==null)this.env.clearInterval(this.timer);this.timer=null;for(const input of this.inputs.values())this.detach(input);this.inputs.clear();if(this.micInput){this.micInput.source.disconnect();this.micInput.analyser.disconnect();this.micInput=null;}this.microphone?.getTracks().forEach(t=>t.stop());this.microphone=null;this.sink?.disconnect();this.sink=null;const ctx=this.context;this.context=null;void ctx?.close().catch(()=>{});}
 stop(message='Stopped; audio is off.',paused=false){this.revision++;this.release();this.state=paused&&this.deadline?'paused':'idle';this.message=message;this.warning=false;if(!paused){this.deadline=0;this.deadlineMono=0;}return this.status();}
 candidates(){const tracks=new Map();for(const element of this.env.elements()){
  // Muted media, especially the local preview, is not evidence of remote audio.
  if(element.muted||element.paused||element.ended||element.volume===0)continue;
  try{for(const track of element.srcObject?.getAudioTracks?.()??[]){if(track.kind==='audio'&&track.readyState==='live'&&track.enabled)tracks.set(track.id,track);}}catch{}
 }return tracks;}
 node(stream){const source=this.context.createMediaStreamSource(stream),analyser=this.context.createAnalyser();analyser.fftSize=2048;source.connect(analyser);analyser.connect(this.sink);return {source,analyser,buffer:new Float32Array(analyser.fftSize)};}
 scan(){if(this.state!=='listening')return;const desired=this.candidates();for(const [id,input] of this.inputs){if(desired.get(id)!==input.original){this.detach(input);this.inputs.delete(id);}}
  for(const [id,original] of desired){if(this.inputs.has(id))continue;let clone;try{clone=original.clone();const input=this.node(this.env.stream([clone]));this.inputs.set(id,{...input,original,clone});}catch{clone?.stop();}}
 }
 level(input){if(!input)return 0;input.analyser.getFloatTimeDomainData(input.buffer);let energy=0;for(const sample of input.buffer)energy+=sample*sample;return Math.min(1,Math.sqrt(energy/input.buffer.length)*3);}
 tick(){if(this.state!=='listening'&&this.state!=='paused')return;if(!this.joined()){this.stop('Meeting ended; audio is off.');return;}if(!this.env.online()){this.stop('Connection lost; audio is off.');return;}
  if(this.env.now()>=this.deadline||this.env.monotonic()>=this.deadlineMono){this.stop('60-minute limit reached; audio is off.');return;}
  this.warning=this.env.now()>=this.deadline-300000||this.env.monotonic()>=this.deadlineMono-300000;
  if(this.state==='listening'){if(!this.microphone?.getAudioTracks().some(t=>t.readyState==='live')){this.stop('Microphone disconnected; audio is off.');return;}const enabled=this.micEnabled();for(const track of this.microphone.getAudioTracks())track.enabled=enabled;this.scan();}
 }
 status(){this.tick();const listening=this.state==='listening';return {state:this.state,message:this.message,joined:this.joined(),warning:this.warning,meetingTracks:this.inputs.size,meetingLevel:listening?Math.max(0,...Array.from(this.inputs.values(),input=>this.level(input))):0,microphoneLevel:listening&&this.micEnabled()?this.level(this.micInput):0,microphoneState:this.env.microphoneState(),contextState:this.context?.state??'closed'};}
 async start(){if(['starting','listening'].includes(this.state))throw Error('The audio check is already starting or running.');if(!this.joined())throw Error('Join a Meet call first.');const resume=this.state==='paused',run=++this.revision;if(this.timer!==null)this.env.clearInterval(this.timer);this.timer=null;this.state='starting';this.message='Checking existing microphone permission…';
  try{const permission=await this.env.permission();if(run!==this.revision)return this.status();if(permission!=='granted')throw Error('Allow your microphone in Meet first. This check will not open a permission window.');
   const mic=await this.env.microphone();if(run!==this.revision){mic.getTracks().forEach(t=>t.stop());return this.status();}this.microphone=mic;if(!this.joined())throw Error('The meeting ended before audio connected.');
   // A separate mic input is gated by Meet's visible mute state. Unknown means off.
   for(const track of mic.getAudioTracks())track.enabled=this.micEnabled();
   const ctx=this.env.audioContext();this.context=ctx;this.sink=ctx.createGain();this.sink.gain.value=0;this.sink.connect(ctx.destination);this.micInput=this.node(mic);
   await this.env.resume(ctx);if(run!==this.revision)return this.status();if(ctx.state!=='running')throw Error('Chrome did not activate audio processing from this flow.');
   if(!resume){this.deadline=this.env.now()+3600000;this.deadlineMono=this.env.monotonic()+3600000;}
   this.state='listening';this.message='Local audio check running. No audio is recorded or sent.';this.timer=this.env.setInterval(()=>this.tick(),250);this.tick();return this.status();
  }catch(error){if(run===this.revision)this.stop(error instanceof Error?error.message:'Audio access failed; audio is off.');throw error;}
 }
 pause(){const result=this.stop('Paused; audio is off.',true);if(this.state==='paused')this.timer=this.env.setInterval(()=>this.tick(),250);return result;}
};
