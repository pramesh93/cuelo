import {createPortal} from 'react-dom';
import {useEffect,useRef,useState} from 'react';
import {useAction,useMutation,useQuery} from 'convex/react';
import {ConvexError} from 'convex/values';
import type {FunctionReturnType} from 'convex/server';
import type {Id} from '../convex/_generated/dataModel';
import {api} from '../convex/_generated/api';
import {Topbar} from './Topbar';
import {SourceManager} from './SourceManager';
import {AnswerCard} from './AnswerCheck';
import {connectCallCapture,type CallCapture,type CaptureStopReason} from './callCapture';
import {connectLiveSpeech,type LiveSpeech} from './liveSpeech';
type Mode='generic'|'document';type Source=NonNullable<FunctionReturnType<typeof api.sources.get>>;
export function LiveCall(){
 const access=useQuery(api.liveCalls.availability,{});const [mode,setMode]=useState<Mode|null>(null),[source,setSource]=useState<{source:Source;guestSecret?:string}|null>(null);
 const [sessionId,setSessionId]=useState<Id<'liveCalls'>|null>(null);const session=useQuery(api.liveCalls.get,sessionId?{sessionId}:'skip');
 const start=useMutation(api.liveCalls.start),change=useMutation(api.liveCalls.change),heartbeat=useMutation(api.liveCalls.heartbeat),append=useMutation(api.liveCalls.append),invalidate=useMutation(api.liveCalls.invalidate);const credential=useAction(api.liveSpeech.connect),answer=useAction(api.liveAnswers.answer);
 const capture=useRef<CallCapture|null>(null),speech=useRef<LiveSpeech|null>(null),abort=useRef<AbortController|null>(null),idRef=useRef<Id<'liveCalls'>|null>(null),generation=useRef(0),epoch=useRef(0),deadline=useRef(0),ending=useRef(false);
 const [floating,setFloating]=useState<Window|null>(null);
 const [state,setState]=useState<'idle'|'preparing'|'ready'|'connecting'|'listening'|'paused'>('idle'),[message,setMessage]=useState('No microphone or meeting audio is connected.'),[warning,setWarning]=useState(false),[busy,setBusy]=useState(false),[result,setResult]=useState<FunctionReturnType<typeof api.liveAnswers.answer>|null>(null);
 const reasonText:Record<CaptureStopReason,string>={user_stop:'Stopped. Meeting audio and microphone are off.',paused:'Paused. Audio and transcription are off; the original call time limit still applies.',meeting_disconnected:'Meeting audio disconnected. Cuelo stopped.',microphone_disconnected:'Your microphone disconnected. Cuelo stopped.',connection_lost:'Connection lost. Cuelo stopped.',page_left:'Cuelo stopped because you left the page.',time_limit:'The 60-minute limit was reached. Cuelo stopped; your Meet call can continue.'};
 const explain=(error:unknown)=>error instanceof ConvexError&&typeof error.data==='string'?error.data:error instanceof Error?error.message:'Cuelo could not connect. Please try again.';
 function end(reason:CaptureStopReason='user_stop',notice?:string){if(ending.current)return;ending.current=true;epoch.current++;setBusy(false);setResult(null);speech.current?.stop();speech.current=null;abort.current?.abort();abort.current=null;capture.current?.stop(reason);capture.current=null;setWarning(false);const id=idRef.current;if(reason!=='paused'){idRef.current=null;setSessionId(null);deadline.current=0;}setState(reason==='paused'?'paused':'idle');setMessage(notice??reasonText[reason]);if(id)void change({sessionId:id,state:reason==='paused'?'paused':'stopped'}).catch(()=>{setMessage('Audio is off. Cuelo could not confirm server cleanup; temporary text will expire automatically.');}).finally(()=>{ending.current=false;});else ending.current=false;}
 useEffect(()=>()=>{epoch.current++;speech.current?.stop();abort.current?.abort();capture.current?.stop();const id=idRef.current;if(id)void change({sessionId:id,state:'stopped'}).catch(()=>{});},[change]);
 useEffect(()=>{if(!sessionId)return;const warningTimer=setTimeout(()=>setWarning(true),Math.max(0,deadline.current-Date.now()-300000));const stopTimer=setTimeout(()=>end('time_limit'),Math.max(0,deadline.current-Date.now()));return()=>{clearTimeout(warningTimer);clearTimeout(stopTimer);};},[sessionId]);
 useEffect(()=>{if(!sessionId||state==='paused')return;const timer=setInterval(()=>{void heartbeat({sessionId}).catch(error=>end('connection_lost',explain(error)));},5000);return()=>clearInterval(timer);},[sessionId,state]);
 useEffect(()=>{if(sessionId&&session===null)end('time_limit','This Cuelo session ended. Audio and transcription stopped.');},[session,sessionId]);
 async function openCard(){
  const pip=(window as unknown as {documentPictureInPicture?:{requestWindow:(options:{width:number;height:number})=>Promise<Window>}}).documentPictureInPicture;
  if(!pip){setMessage('Floating mode is unavailable. Keep Cuelo and Google Meet in two windows side by side.');return;}
  try{const card=await pip.requestWindow({width:440,height:440});card.document.title='Cuelo';for(const link of document.querySelectorAll('link[rel="stylesheet"],style'))card.document.head.appendChild(link.cloneNode(true));card.document.body.style.padding='16px';card.addEventListener('pagehide',()=>setFloating(null),{once:true});setFloating(card);}catch{setMessage('The floating card could not open. Keep Cuelo and Google Meet in two windows side by side.');}
 }
 useEffect(()=>()=>floating?.close(),[floating]);
 async function prepare(){if(!mode)return;setState('preparing');setMessage('Checking access and the testing allowance…');try{const admitted=await start({mode,...(mode==='document'&&source?{sourceId:source.source.id,guestSecret:source.guestSecret}:{})});idRef.current=admitted.sessionId;deadline.current=admitted.deadline;setSessionId(admitted.sessionId);setState('ready');setMessage('Ready. Click Connect call audio, select the Meet tab and enable tab audio.');}catch(error){setState('idle');setMessage(explain(error));}}
 async function connect(){const id=idRef.current;if(!id)return;const run=++epoch.current;const controller=new AbortController();abort.current=controller;setState('connecting');setMessage('Select the Meet tab and enable tab audio, then allow your microphone.');
 try{
  // Start native capture directly from this click, before any asynchronous backend request.
  const native=await connectCallCapture({deadlineMs:deadline.current,signal:controller.signal,onWarning:()=>setWarning(true),onStopped:reason=>end(reason)});
  if(run!==epoch.current){native.stop();return;}capture.current=native;
  if(state==='paused')await change({sessionId:id,state:'active'});
  const grant=await credential({sessionId:id});if(run!==epoch.current)return;if(!grant.token)throw new Error(grant.message);generation.current=grant.generation;
  const live=await connectLiveSpeech({capture:native,token:grant.token,signal:controller.signal,onFailure:notice=>end('connection_lost',notice),onCustomerSpeech:()=>{if(controller.signal.aborted||idRef.current!==id)return;setResult(null);setBusy(false);epoch.current++;void invalidate({sessionId:id}).catch(()=>end('connection_lost'));},onTurn:async(speaker,text)=>{
   if(!idRef.current||controller.signal.aborted)return;const stored=await append({sessionId:id,generation:generation.current,speaker,text});if(speaker==='salesperson')return;const request=++epoch.current;setResult(null);setBusy(true);
   void answer({sessionId:id,utteranceId:stored.utteranceId}).then(response=>{if(request!==epoch.current||controller.signal.aborted)return;if(response.status==='error'){end('connection_lost',response.message);return;}if(response.status!=='cancelled')setResult(response);}).catch(error=>{if(request===epoch.current)end('connection_lost',explain(error));}).finally(()=>{if(request===epoch.current)setBusy(false);});
  }});
  if(controller.signal.aborted){live.stop();return;}speech.current=live;setState('listening');setMessage('Listening to the customer. Your microphone adds context; it does not trigger answers.');
 }catch(error){if(!controller.signal.aborted)end('connection_lost',explain(error));}}
 return <><Topbar/><main className="account-page live-call-page"><h1>Cuelo on your call.</h1><p className="intro">Customer questions become short text answers. Cuelo never speaks.</p>
 {!access?.signedIn?<p><a href="/?view=account">Sign in with Google</a> to set up a call.</p>:<>
 {state==='idle'&&<><h2>How should Cuelo answer on this call?</h2><fieldset className="mode-options"><legend className="sr-only">Answer mode</legend><label className={`mode-option ${mode==='generic'?'selected':''}`}><input type="radio" name="live-mode" checked={mode==='generic'} onChange={()=>{setMode('generic');setSource(null);}}/><span><strong>Generic answers</strong><span>General knowledge. Not from your document.</span></span></label><label className={`mode-option ${mode==='document'?'selected':''}`}><input type="radio" name="live-mode" checked={mode==='document'} onChange={()=>{setMode('document');setSource(null);}}/><span><strong>Answers from my document</strong><span>Grounded in the source you confirm.</span></span></label></fieldset>
 {mode==='document'&&<SourceManager savedOnly onSourceChanged={()=>setSource(null)} onConfirmed={(chosen,scope)=>setSource({source:chosen,...scope})}/>}
 {!access.invited&&<p className="setup-notice">Live calls are available to invited testers only.</p>}{!access.enabled&&<p className="setup-notice">Live listening testing is not enabled yet. No paid connection will start.</p>}
 <button className="primary" disabled={!mode||mode==='document'&&!source||!access.enabled||!access.invited} onClick={prepare}>Prepare call</button></>}
 {(state==='ready'||state==='paused')&&<button className="primary" onClick={connect}>{state==='paused'?'Resume listening':'Connect call audio'}</button>}
 {sessionId&&<button type="button" className="cancel-button" onClick={openCard}>Open floating card</button>}
 {state==='listening'&&<button type="button" className="cancel-button" onClick={()=>end('paused')}>Pause</button>}
 {state!=='idle'&&<button type="button" className="cancel-button" onClick={()=>end()}>Stop</button>}
 </>}
 <p role="status">{message}</p>{warning&&<p role="status">Five minutes remain. Cuelo stops at 60 minutes; Google Meet can continue.</p>}
 {sessionId&&<p className="supporting">{mode==='generic'?'Generic answers · Not from your document':`Answers from ${source?.source.title??'your confirmed document'}`} · Keep this page open. If you leave Meet while its tab stays open, click Stop here.</p>}
 {busy&&<p role="status">Finding the answer. Listening continues.</p>}{result&&<><p className="asked">{result.question}</p><AnswerCard result={result}/></>}
 {floating&&createPortal(<div><h2>Cuelo</h2><p>{state==='listening'?'Listening':state==='paused'?'Paused':'Audio off'}</p>{busy&&<p role="status">Finding the answer. Listening continues.</p>}{result&&<AnswerCard result={result}/>}<button type="button" onClick={()=>end()}>Stop</button><button type="button" onClick={()=>floating.close()}>Hide card</button></div>,floating.document.body)}
 <p className="supporting">Sharing your whole screen may expose the floating card.</p>
 <footer>Built for desktop Chrome. Stop turns off Cuelo, not Google Meet.</footer></main></>;
}
