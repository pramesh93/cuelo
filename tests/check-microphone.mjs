// SIMULATED: a generated audio stream plus mocked provider responses. No paid requests.
import {chromium} from "playwright-core";
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
const url=process.env.CUELO_TEST_URL ?? "http://127.0.0.1:5173/";
const browser=await chromium.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true,args:["--autoplay-policy=no-user-gesture-required"]});
const question="Do you support SSO on the Pro plan?";
try {
  const context=await browser.newContext({permissions:["microphone"],viewport:{width:1440,height:1100}});
  let transcripts=0;let answers=0;let empty=false;let late=false;let releaseLate;
  let spokenQuestion=question;
  let sourceFails=false;let slowSource=false;let releaseSource;let discards=0;
  let preparations=0;let preparingWhileListening=false;let preparedTicket;
  const page=await context.newPage();
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.addInitScript(()=>{
    window.__micTracks=[];
    // Wall-clock listening time is not proof that headless Chrome delivered
    // audio frames. Observe real worklet messages before pressing Stop.
    const OriginalWorkletNode=window.AudioWorkletNode;
    window.AudioWorkletNode=class extends OriginalWorkletNode {
      constructor(...args) {
        super(...args);
        window.__currentWorklet=this;window.__capturedFrames=0;
        this.port.addEventListener("message",event=>{
          if(window.__currentWorklet===this) window.__capturedFrames+=event.data.length;
        });
        this.port.start();
      }
    };
    navigator.mediaDevices.getUserMedia=async ()=>{
      const audio=new AudioContext();
      const oscillator=audio.createOscillator();const gain=audio.createGain();gain.gain.value=0.08;
      const destination=audio.createMediaStreamDestination();
      oscillator.connect(gain);gain.connect(destination);oscillator.start();await audio.resume();
      const stream=destination.stream;
      for(const track of stream.getTracks()) {
        const stop=track.stop.bind(track);
        track.stop=()=>{stop();oscillator.stop();void audio.close();};
      }
      window.__micTracks.push(...stream.getTracks());return stream;
    };
    window.__getTestMicrophone=navigator.mediaDevices.getUserMedia;
  });
  const success=async(route,value)=>route.fulfill({json:{status:"success",value}});
  await page.route("**/api/query",route=>success(route,{enabled:true,message:""}));
  await page.route("**/api/mutation",route=>{discards++;return success(route,null);});
  await page.route("**/api/action",async route=>{
    const body=route.request().postDataJSON();
    if(body.path==="sourcePreparation:prepare") {
      preparations++;
      if(slowSource) await new Promise(resolve=>{releaseSource=resolve;});
      if(sourceFails) {await success(route,{ticket:null,message:"Source unavailable for this test."});return;}
      preparingWhileListening ||= (await page.locator(".speech-status").innerText()).includes("Listening");
      preparedTicket={id:"made-up-source-id",secret:`test-secret-${preparations}`};
      await success(route,{ticket:preparedTicket,message:""});return;
    }
    if(body.path==="speech:transcribe") {
      transcripts++;
      const audio=Buffer.from(body.args[0].audio.$bytes,"base64");
      assert.equal(audio.toString("ascii",0,4),"RIFF");
      assert.equal(audio.readUInt32LE(24),16000);
      assert.ok(audio.length>3244 && audio.length<=640044);
      if(late) await new Promise(resolve=>{releaseLate=resolve;});
      await success(route,empty ? {status:"error",transcript:null,message:"I couldn’t hear a clear question. Try again closer to your microphone, or type it below.",elapsedMs:50}
        : {status:"ok",transcript:spokenQuestion,message:"",elapsedMs:50});return;
    }
    assert.equal(body.path,"evaluation:ask");answers++;
    assert.equal(body.args[0].question,spokenQuestion);
    assert.deepEqual(body.args[0].sourceTicket,preparedTicket);
    const supported=spokenQuestion===question;
    await success(route,{status:supported ? "verified" : "unverified",answer:supported ? "SAML SSO is available on Pro if you’ve connected a Salesforce org to Slack." : "Not verified in this source",excerpt:supported ? "Available on the Free and Pro subscriptions if you’ve connected a Salesforce org to Slack" : null,section:supported ? "Who can use this feature?" : null,sourceTitle:"Set up SAML single sign-on for Slack",sourceUrl:"https://slack.com/help/articles/203772216-SAML-single-sign-on",elapsedMs:100});
  });
  async function start() {
    await page.getByRole("button",{name:"Speak a question",exact:true}).click();
    await page.getByRole("button",{name:"Stop & answer",exact:true}).waitFor({timeout:10000}).catch(async error=>{
      console.log("Microphone status:",await page.locator(".speech-input").innerText());
      console.log("Browser errors:",errors);throw error;
    });
    // Wait for a displayed capture duration, not an arbitrary sleep.
    await page.getByRole("status").filter({hasText:"Listening · 1s"}).waitFor();
    await page.waitForFunction(()=>window.__capturedFrames>=16000);
  }
  const stopped=()=>page.evaluate(()=>window.__micTracks.every(track=>track.readyState==="ended"));
  await page.goto(url);
  await start();await page.getByRole("button",{name:"Stop & answer",exact:true}).click();
  await page.getByRole("heading",{name:"Exact supporting excerpt"}).waitFor({timeout:10000}).catch(async error=>{console.log({preparations,transcripts,answers,errors,status:await page.locator(".speech-input").innerText(),answer:await page.locator(".answer-panel").innerText()});throw error;});
  assert.equal(await page.getByRole("textbox").inputValue(),question);
  assert.match(await page.locator(".answer").innerText(),/if.*Salesforce/i);
  assert.equal(await stopped(),true);
  assert.equal(preparingWhileListening,true,"source preparation starts while the microphone is listening");
  await mkdir("artifacts",{recursive:true});
  await page.screenshot({path:"artifacts/SIMULATED-microphone-desktop.png",fullPage:true});
  spokenQuestion="Can you guarantee a custom integration by Friday?";
  await start();await page.getByRole("button",{name:"Stop & answer",exact:true}).click();
  await page.getByText("Not verified in this source",{exact:true}).waitFor();
  assert.equal(await page.locator("blockquote").count(),0);assert.equal(await stopped(),true);
  spokenQuestion=question;
  await start();await page.getByRole("button",{name:"Cancel",exact:true}).click();
  assert.equal(await stopped(),true);assert.equal(transcripts,2);
  empty=true;
  await start();await page.getByRole("button",{name:"Stop & answer",exact:true}).click();
  await page.getByRole("alert").filter({hasText:"couldn’t hear"}).waitFor();assert.equal(answers,2);
  empty=false;late=true;
  await start();await page.getByRole("button",{name:"Stop & answer",exact:true}).click();
  await page.waitForRequest(request=>request.url().endsWith("/api/action"),{timeout:1000}).catch(()=>{});
  await page.waitForFunction(()=>document.querySelector(".speech-status")?.textContent.includes("Turning your speech"));
  // The route has received the request before cancellation.
  while(!releaseLate) await new Promise(resolve=>setTimeout(resolve,10));
  await page.getByRole("button",{name:"Cancel",exact:true}).click();releaseLate();
  await page.getByText("Cancelled. Nothing new will be shown.").waitFor();
  await page.getByRole("button",{name:"Speak a question",exact:true}).waitFor();
  assert.equal(await stopped(),true);assert.equal(answers,2);
  late=false;
  await start();await page.evaluate(()=>window.__micTracks.at(-1).dispatchEvent(new Event("ended")));
  await page.getByRole("alert").filter({hasText:"disconnected"}).waitFor();assert.equal(await stopped(),true);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:"artifacts/SIMULATED-microphone-narrow.png",fullPage:true});
  await start();
  await page.evaluate(()=>{
    Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});
    document.dispatchEvent(new Event("visibilitychange"));
  });
  assert.equal(await stopped(),false,"hiding the page must keep capture running");
  await page.getByRole("button",{name:"Stop & answer",exact:true}).waitFor();
  await page.evaluate(()=>{delete document.hidden;});
  await page.getByRole("button",{name:"Cancel",exact:true}).click();
  assert.equal(await stopped(),true);
  await page.evaluate(()=>{
    navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{window.__allowPendingMicrophone=async()=>resolve(await window.__getTestMicrophone());});
  });
  await page.getByRole("button",{name:"Speak a question",exact:true}).click();
  await page.waitForFunction(()=>typeof window.__allowPendingMicrophone==="function");
  await page.getByRole("button",{name:"Cancel",exact:true}).click();
  await page.evaluate(async()=>{await window.__allowPendingMicrophone();navigator.mediaDevices.getUserMedia=window.__getTestMicrophone;});
  await page.waitForFunction(()=>window.__micTracks.every(track=>track.readyState==="ended"));
  const sentBeforeLimit=transcripts;
  await start();
  await page.getByRole("alert").filter({hasText:"20-second limit reached"}).waitFor({timeout:25000});
  assert.equal(await stopped(),true);assert.equal(transcripts,sentBeforeLimit);
  sourceFails=true;
  const beforeSourceFailure=transcripts;
  await start();await page.getByRole("button",{name:"Stop & answer",exact:true}).click();
  await page.getByRole("alert").filter({hasText:"Source unavailable"}).waitFor();
  assert.equal(transcripts,beforeSourceFailure,"source failure does not spend on transcription");
  assert.equal(await stopped(),true);sourceFails=false;slowSource=true;
  await start();await page.getByRole("button",{name:"Stop & answer",exact:true}).click();
  await page.getByRole("status").filter({hasText:"Preparing the article"}).waitFor();
  assert.equal(await stopped(),true);
  await page.getByRole("button",{name:"Cancel",exact:true}).click();
  const discardedBefore=discards;releaseSource();
  await page.waitForResponse(response=>response.url().endsWith("/api/mutation"));
  assert.ok(discards>discardedBefore,"late prepared source is discarded after cancellation");
  assert.equal(transcripts,beforeSourceFailure);slowSource=false;
  await start();
  const sentBeforeLeaving=transcripts;
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent("pagehide")));
  assert.equal(await stopped(),true,"leaving the page must release capture");
  assert.equal(transcripts,sentBeforeLeaving);
  assert.deepEqual(errors,[]);
  const denied=await browser.newContext();
  await denied.grantPermissions([]);const deniedPage=await denied.newPage();
  await deniedPage.route("**/api/query",route=>success(route,{enabled:true,message:""}));
  await deniedPage.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException("Denied","NotAllowedError");};});
  await deniedPage.goto(url);await deniedPage.getByRole("button",{name:"Speak a question",exact:true}).click();
  await deniedPage.getByRole("alert").filter({hasText:"permission was denied"}).waitFor();
  console.log("SIMULATED microphone checks passed: PCM capture, sourced answer and refusal through the unchanged answer path, Stop cleanup, cancel, empty transcript, late-response cancellation, device loss, permission refusal, background capture, page-leave cleanup, late permission, 20-second cutoff and narrow layout. No real speech or provider calls tested.");
} finally {await browser.close();}
