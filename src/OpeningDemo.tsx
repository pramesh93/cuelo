import {useEffect,useRef,useState} from 'react';
import {useAction,useConvexAuth,useQuery} from 'convex/react';
import {ConvexError} from 'convex/values';
import {api} from '../convex/_generated/api';
import type {FunctionReturnType} from 'convex/server';
import {getOpeningBrowserSecret} from './openingIdentity';
import {openingDay} from '../convex/openingPolicy';
import {startQuestionCapture,type QuestionCapture} from './microphone';
import {CallDownloads} from './CallDownloads';
import {MicIcon} from './Topbar';
type Result=FunctionReturnType<typeof api.openingDemo.ask>;
export function OpeningDemo(){
 const {isAuthenticated,isLoading}=useConvexAuth();
 const [browserSecret,setSecret]=useState(''),[identityError,setIdentityError]=useState(''),[day,setDay]=useState(()=>openingDay(Date.now()));
 const allowance=useQuery(api.openingBudget.status,browserSecret&&!isLoading?{browserSecret,day}:'skip');
 const ask=useAction(api.openingDemo.ask);
 const [phase,setPhase]=useState<'idle'|'requesting'|'listening'|'answering'>('idle'),[message,setMessage]=useState(''),[result,setResult]=useState<Result|null>(null),[downloads,setDownloads]=useState(false);
 const downloadButton=useRef<HTMLButtonElement>(null);
 const capture=useRef<QuestionCapture|null>(null),controller=useRef<AbortController|null>(null),revision=useRef(0);
 useEffect(()=>{let alive=true;void getOpeningBrowserSecret().then(secret=>{if(alive)setSecret(secret);}).catch(error=>{if(alive)setIdentityError(error.message);});const timer=setInterval(()=>setDay(openingDay(Date.now())),30000);return()=>{alive=false;clearInterval(timer);};},[]);
 useEffect(()=>{const stop=()=>{revision.current++;controller.current?.abort();capture.current?.cancel();capture.current=null;};window.addEventListener('pagehide',stop);return()=>{stop();window.removeEventListener('pagehide',stop);};},[]);
 useEffect(()=>{if(isAuthenticated){revision.current++;controller.current?.abort();capture.current?.cancel();capture.current=null;setPhase('idle');}},[isAuthenticated]);
 const exhausted=allowance?.remaining===0;
 function fail(text:string,id:number){if(id!==revision.current)return;controller.current?.abort();capture.current?.cancel();capture.current=null;setPhase('idle');setMessage(text);}
 async function speak(){
  if(phase==='listening'){
   const id=revision.current;setPhase('answering');setMessage('Finding your answer…');
   try{const audio=await capture.current!.stop();capture.current=null;const response=await ask({browserSecret,requestKey:crypto.randomUUID(),audio});if(id!==revision.current)return;setResult(response);setMessage(response.message||'Your answer is ready. The microphone is off.');}
   catch(error){if(id===revision.current)setMessage(error instanceof ConvexError&&typeof error.data==='string'?error.data:'Your answer could not load. Please try again.');}
   finally{if(id===revision.current)setPhase('idle');}return;
  }
  if(!allowance?.enabled||exhausted||allowance.busy||isAuthenticated)return;
  const id=++revision.current;controller.current=new AbortController();setPhase('requesting');setMessage('Allow microphone access to ask your question.');
  try{capture.current=await startQuestionCapture({signal:controller.current.signal,onInterrupted:()=>fail('Your microphone disconnected. Reconnect it and try again.',id),onLimit:()=>fail('Please keep your question under 20 seconds.',id)});if(id!==revision.current){capture.current.cancel();return;}setPhase('listening');setMessage('Listening. Tap Finish question when you’re ready.');}
  catch(error){fail(error instanceof Error&&error.name==='NotAllowedError'?'Microphone access is off. Allow it in Chrome to speak to Cuelo.':error instanceof Error?error.message:'Your microphone could not start.',id);}
 }
 return <>
 <div className={`conversation-stage ${phase==='listening'?'is-listening':''}`}>
 <div className="blob-area"><div className="blob-handle" aria-hidden="true"><span className="cuelo-blob"><span className="blob-glint"/><span className="blob-face"><span className="blob-eye left-eye"/><span className="blob-eye right-eye"/></span></span></div><p className="blob-caption">Quiet by nature.</p></div>
 <section className="welcome-card" aria-labelledby="welcome-heading" aria-live="polite" aria-busy={phase==='answering'}><div className="card-presence"><span aria-hidden="true"/>Cuelo</div>
 <h2 id="welcome-heading">{phase==='answering'?'Finding your answer…':result?'Here’s your answer.':'Try Cuelo.'}</h2>
 {result?<>{result.question&&<p className="opening-question">{result.question}</p>}{result.bullets.length>0&&<ul>{result.bullets.map((line,index)=><li key={index}>{line}</li>)}</ul>}{result.message&&<p>{result.message}</p>}{result.citations.length>0&&<details><summary>See supporting passage</summary>{result.citations.map(p=><div key={p.ordinal}><strong>{p.reference}</strong><p>{p.text}</p></div>)}<p>{result.source?.title}</p></details>}</>:<p>Ask a question out loud.<br/>Get a short answer here.</p>}
 </section></div>
 <div className="opening-controls">
 {isAuthenticated?<a className="voice-action" href="/?view=account">Use Cuelo in a call</a>:exhausted?<><p role="status">Sign in to keep using Cuelo.</p><a className="voice-action" href="/?view=account&intent=login">Sign in</a></>:<button className="voice-action" type="button" onClick={()=>{void speak();}} disabled={phase==='requesting'||phase==='answering'||phase!=='listening'&&(!allowance?.enabled||allowance.busy)}><MicIcon/>{phase==='listening'?'Finish question':phase==='requesting'?'Opening microphone…':phase==='answering'?'Finding your answer…':'Speak to Cuelo'}</button>}
 {(phase==='listening'||phase==='requesting')&&<button className="text-button" onClick={()=>{revision.current++;controller.current?.abort();capture.current?.cancel();capture.current=null;setPhase('idle');setMessage('');}}>Cancel</button>}
 {(identityError||message||allowance?.busy&&phase==='idle')&&<p className="supporting" role="status">{identityError||message||'Cuelo is answering a question in another tab. Please wait.'}</p>}
 <button className="call-experience-button" ref={downloadButton} type="button" onClick={()=>setDownloads(true)}>Try Cuelo on a call</button>
 </div>
 {downloads&&<CallDownloads onClose={()=>{setDownloads(false);downloadButton.current?.focus();}}/>}
 </>;
}
