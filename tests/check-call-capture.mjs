// SIMULATED: generated media, a declared tab setting and simulated ended events.
// Does not prove Chrome tab selection, actual Meet closure or physical microphone.
import {chromium} from "playwright-core";
import assert from "node:assert/strict";
const browser=await chromium.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true,args:["--autoplay-policy=no-user-gesture-required"]});
let providerRequests=0;
try {
  const context=await browser.newContext();
  await context.route(/deepgram\.com|api\.openai\.com/,async route=>{providerRequests++;await route.abort();});
  const page=await context.newPage();const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto(process.env.CUELO_TEST_URL ?? "http://127.0.0.1:5173/");
  const result=await page.evaluate(async()=>{
    const {installCallCaptureGuard}=await import("/src/callCapture.ts");
    async function generated() {
      const contexts=[];
      async function audioStream() {
        const context=new AudioContext();contexts.push(context);
        const oscillator=context.createOscillator();const gain=context.createGain();gain.gain.value=.025;
        const destination=context.createMediaStreamDestination();oscillator.connect(gain);gain.connect(destination);oscillator.start();await context.resume();
        return destination.stream;
      }
      const meetingAudio=await audioStream(),microphone=await audioStream();
      const canvas=document.createElement("canvas");canvas.width=64;canvas.height=64;
      canvas.getContext("2d").fillRect(0,0,64,64);
      const video=canvas.captureStream(1).getVideoTracks()[0];
      // A test declaration, not native screen/tab capture.
      video.getSettings=()=>({displaySurface:"browser"});
      const meeting=new MediaStream([...meetingAudio.getTracks(),video]);
      let warnings=0;const reasons=[];const abort=new AbortController();
      return {meeting,microphone,video,contexts,reasons,abort,
        get warnings(){return warnings;},
        options:{meeting,microphone,deadlineMs:Date.now()+3600000,signal:abort.signal,onStopped:reason=>reasons.push(reason),onWarning:()=>{warnings++;}}};
    }
    const f=await generated();const guard=installCallCaptureGuard(f.options);
    Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"));
    const backgroundActive=guard.active;delete document.hidden;
    f.video.stop();f.video.dispatchEvent(new Event("ended")); // Simulated source closure signal.
    const closure={reasons:f.reasons,active:guard.active,ended:[...f.meeting.getTracks(),...f.microphone.getTracks()].every(t=>t.readyState==="ended")};
    const g=await generated();const manual=installCallCaptureGuard(g.options);manual.stop();
    const manualStop={reasons:g.reasons,ended:[...g.meeting.getTracks(),...g.microphone.getTracks()].every(t=>t.readyState==="ended")};
    const h=await generated();
    const cutoff=installCallCaptureGuard({...h.options,deadlineMs:Date.now()+150});
    await new Promise(resolve=>{const check=()=>{if(!cutoff.active)resolve();else setTimeout(check,10);};check();});
    const deadline={reasons:h.reasons,warnings:h.warnings,ended:[...h.meeting.getTracks(),...h.microphone.getTracks()].every(t=>t.readyState==="ended")};
    for(const fixture of [f,g,h])for(const context of fixture.contexts)await context.close();
    return {backgroundActive,closure,manualStop,deadline};
  });
  assert.equal(result.backgroundActive,true);
  assert.deepEqual(result.closure,{reasons:["meeting_disconnected"],active:false,ended:true});
  assert.deepEqual(result.manualStop,{reasons:["user_stop"],ended:true});
  assert.deepEqual(result.deadline,{reasons:["time_limit"],warnings:1,ended:true});
  assert.equal(providerRequests,0);assert.deepEqual(errors,[]);
  console.log("SIMULATED Chrome checks passed: generated capture, hidden-page continuity, simulated source-ended cleanup, explicit Stop and accelerated cutoff. No real Meet/tab-closure/microphone proof or provider requests.");
} finally{await browser.close();}
