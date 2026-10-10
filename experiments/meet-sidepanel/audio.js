let stream,context,timer,cutoff;
async function stop(){clearInterval(timer);clearTimeout(cutoff);stream?.getTracks().forEach(t=>t.stop());stream=null;if(context)await context.close();context=null;}
chrome.runtime.onMessage.addListener((m,_sender,reply)=>{
 if(m.to!=='audio')return;
 (async()=>{if(m.type==='stop'){await stop();return {ok:true};}if(m.type!=='start')throw Error('Unknown audio action');await stop();
 stream=await navigator.mediaDevices.getUserMedia({audio:{mandatory:{chromeMediaSource:'tab',chromeMediaSourceId:m.streamId}},video:false});
 context=new AudioContext();const input=context.createMediaStreamSource(stream);const analyser=context.createAnalyser();analyser.fftSize=256;input.connect(analyser);input.connect(context.destination);await context.resume();
 const values=new Float32Array(analyser.fftSize);timer=setInterval(()=>{analyser.getFloatTimeDomainData(values);let peak=0;for(const sample of values)peak=Math.max(peak,Math.abs(sample));void chrome.runtime.sendMessage({type:'level',peak}).catch(()=>{});},250);
 cutoff=setTimeout(()=>{void stop().then(()=>chrome.runtime.sendMessage({type:'ended'})).catch(()=>{});},60000);return {ok:true};
 })().then(reply).catch(()=>{void stop();reply({ok:false});});return true;
});
