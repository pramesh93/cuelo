import {test} from "node:test";
import assert from "node:assert/strict";
import {installCallCaptureGuard, connectCallCapture, type CaptureStopReason} from "../src/callCapture";

class Track extends EventTarget {
  readyState="live";stops=0;
  constructor(readonly kind:"audio"|"video",readonly surface="browser") {super();}
  stop() {this.readyState="ended";this.stops++;}
  getSettings() {return this.kind==="video" ? {displaySurface:this.surface} : {};}
  end() {this.readyState="ended";this.dispatchEvent(new Event("ended"));}
}
const stream=(...tracks:Track[])=>({getTracks:()=>tracks,getAudioTracks:()=>tracks.filter(t=>t.kind==="audio"),getVideoTracks:()=>tracks.filter(t=>t.kind==="video")} as unknown as MediaStream);
function fixture() {
  const tabAudio=new Track("audio"),tabVideo=new Track("video"),mic=new Track("audio");
  const page=new EventTarget(),visibility=new EventTarget();let now=0;
  let scheduled:(()=>void)|null=null;
  const runtime={page,visibility,now:()=>now,monotonic:()=>now,setTimer:(callback:()=>void)=>{scheduled=callback;return ()=>{scheduled=null;};}};
  const reasons:CaptureStopReason[]=[];let warnings=0;
  return {tabAudio,tabVideo,mic,page,visibility,runtime,reasons,
    get warnings(){return warnings;},
    options:{meeting:stream(tabAudio,tabVideo),microphone:stream(mic),deadlineMs:3600000,signal:new AbortController().signal,onStopped:(reason:CaptureStopReason)=>{reasons.push(reason);},onWarning:()=>{warnings++;},runtime},
    tick:(time:number)=>{now=time;scheduled?.();},
  };
}

test("meeting capture ending releases both feeds once, without waiting for a provider",()=>{
  const f=fixture();const guard=installCallCaptureGuard(f.options);
  f.tabVideo.end();assert.equal(guard.active,false);
  assert.deepEqual(f.reasons,["meeting_disconnected"]);
  for(const track of [f.tabAudio,f.tabVideo,f.mic])assert.equal(track.stops,1);
  guard.stop();f.tabAudio.end();assert.equal(f.reasons.length,1);
});

test("window visibility and silence keep capture, but page leave, microphone loss and offline stop it",()=>{
  for(const reason of ["page_left","microphone_disconnected","connection_lost"] as const) {
    const f=fixture();const guard=installCallCaptureGuard(f.options);
    f.visibility.dispatchEvent(new Event("visibilitychange"));assert.equal(guard.active,true);
    f.tick(60000);assert.equal(guard.active,true);
    if(reason==="page_left")f.page.dispatchEvent(new Event("pagehide"));
    if(reason==="microphone_disconnected")f.mic.end();
    if(reason==="connection_lost")f.page.dispatchEvent(new Event("offline"));
    assert.deepEqual(f.reasons,[reason]);assert.equal(f.tabAudio.readyState,"ended");assert.equal(f.mic.readyState,"ended");
  }
});

test("warns at 55 minutes, stops at 60 and checks expiry when waking; a resume cannot reset its deadline",()=>{
  const f=fixture();const guard=installCallCaptureGuard(f.options);
  f.tick(3299999);assert.equal(f.warnings,0);assert.equal(guard.active,true);
  f.tick(3300000);f.tick(3301000);assert.equal(f.warnings,1);
  f.tick(3600000);assert.deepEqual(f.reasons,["time_limit"]);assert.equal(guard.active,false);
  const g=fixture();g.tick(3500000);const resumed=installCallCaptureGuard(g.options);
  assert.equal(g.warnings,1);g.tick(3600000);assert.equal(resumed.active,false);
  const h=fixture();const waking=installCallCaptureGuard(h.options);
  // No timer callback while asleep; check the original deadline on pageshow.
  h.runtime.now=()=>4000000;h.runtime.monotonic=()=>4000000;
  h.page.dispatchEvent(new Event("pageshow"));assert.equal(waking.active,false);assert.deepEqual(h.reasons,["time_limit"]);
});

test("manual Stop and Pause work without waiting for an ended event, and cancellation stops capture",()=>{
  for(const reason of ["user_stop","paused"] as const){const f=fixture();const guard=installCallCaptureGuard(f.options);guard.stop(reason);assert.deepEqual(f.reasons,[reason]);assert.equal(f.mic.readyState,"ended");}
  const f=fixture();const abort=new AbortController();const guard=installCallCaptureGuard({...f.options,signal:abort.signal});
  abort.abort();assert.equal(guard.active,false);assert.deepEqual(f.reasons,["user_stop"]);
});

test("rejects absent tab audio, entire-screen capture and already-ended feeds, releasing all capture",()=>{
  for(const missing of ["audio","tab","ended"]){
    const f=fixture();
    const meeting=missing==="audio" ? stream(f.tabVideo) : missing==="tab" ? stream(new Track("video","monitor"),f.tabAudio) : f.options.meeting;
    if(missing==="ended")f.tabAudio.end();
    assert.throws(()=>installCallCaptureGuard({...f.options,meeting}),/tab audio|Meet tab|disconnected/i);
    assert.equal(f.mic.readyState,"ended");for(const track of meeting.getTracks())assert.equal(track.readyState,"ended");
  }
});

test("cancellation while waiting for permission releases existing and late streams; mic refusal releases the tab",async()=>{
  const f=fixture();const abort=new AbortController();let allowMic:(value:MediaStream)=>void=()=>{};let requested=false;
  const devices={getDisplayMedia:async()=>f.options.meeting,getUserMedia:async()=>{requested=true;return await new Promise<MediaStream>(resolve=>{allowMic=resolve;});}};
  const pending=connectCallCapture({...f.options,signal:abort.signal,devices});
  await Promise.resolve();await Promise.resolve();assert.equal(requested,true);
  abort.abort();assert.equal(f.tabAudio.readyState,"ended");allowMic(f.options.microphone);
  await assert.rejects(()=>pending,{name:"AbortError"});assert.equal(f.mic.readyState,"ended");
  const g=fixture();await assert.rejects(()=>connectCallCapture({...g.options,devices:{getDisplayMedia:async()=>g.options.meeting,getUserMedia:async()=>{throw new DOMException("Denied","NotAllowedError");}}}),{name:"NotAllowedError"});
  assert.equal(g.tabAudio.readyState,"ended");assert.equal(g.tabVideo.readyState,"ended");
});
