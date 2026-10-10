// Unpaid feasibility check only. It neither records nor forwards audio. Never
// ask from here if Meet's existing microphone permission is not already granted.
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(message?.type!=='cuelo-microphone-probe'||sender.id!==chrome.runtime.id)return;
 if(globalThis.cueloProbeMeetingState(document,location.pathname)!=='joined'){reply({microphone:'not-in-meeting'});return;}
 let finished=false;
 const finish=result=>{if(finished)return;finished=true;clearTimeout(timer);reply(result);};
 const timer=setTimeout(()=>finish({microphone:'timed-out'}),5000);
 void(async()=>{
  try{
   const permission=await navigator.permissions.query({name:'microphone'});
   if(permission.state!=='granted'){finish({microphone:permission.state});return;}
   const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});
   const usable=stream.getAudioTracks().some(track=>track.readyState==='live');
   stream.getTracks().forEach(track=>track.stop());
   finish({microphone:usable?'existing-permission-works':'no-live-microphone'});
  }catch(error){finish({microphone:error?.name==='NotAllowedError'?'permission-not-reused':error?.name==='NotFoundError'?'no-microphone':error?.name==='NotReadableError'?'microphone-unavailable':'check-failed'});}
 })();return true;
});
