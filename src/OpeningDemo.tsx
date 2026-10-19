import {useEffect,useRef,useState} from 'react';
import {useAction,useConvexAuth,useQuery} from 'convex/react';
import {ConvexError} from 'convex/values';
import {api} from '../convex/_generated/api';
import type {FunctionReturnType} from 'convex/server';
import {getOpeningBrowserSecret} from './openingIdentity';
import {openingDay} from '../convex/openingPolicy';
import {startQuestionCapture,type QuestionCapture} from './microphone';
import {checkedWebSources} from '../convex/publicAnswerPolicy';
import {MicIcon} from './Topbar';
type Result=FunctionReturnType<typeof api.openingDemo.ask>;
export function OpeningDemo(){
 const {isAuthenticated,isLoading}=useConvexAuth();
 const [browserSecret,setSecret]=useState(''),[identityError,setIdentityError]=useState(''),[day,setDay]=useState(()=>openingDay(Date.now()));
 const allowance=useQuery(api.openingBudget.status,browserSecret&&!isLoading?{browserSecret,day}:'skip');
 const ask=useAction(api.openingDemo.ask);
 const [phase,setPhase]=useState<'idle'|'requesting'|'listening'|'answering'>('idle'),[message,setMessage]=useState(''),[result,setResult]=useState<Result|null>(null);
 const [limitShown,setLimitShown]=useState(false),[answerArrival,setAnswerArrival]=useState(false);
 useEffect(()=>{if(!answerArrival)return;const timer=setTimeout(()=>setAnswerArrival(false),1100);return()=>clearTimeout(timer);},[answerArrival]);
 const limitAction=useRef<HTMLAnchorElement>(null);
 const limitStorageKey=`cuelo-opening-limit-shown-${import.meta.env?.VITE_CONVEX_URL??'local'}`;
 const capture=useRef<QuestionCapture|null>(null),controller=useRef<AbortController|null>(null),revision=useRef(0);
 useEffect(()=>{let alive=true;void getOpeningBrowserSecret().then(secret=>{if(alive)setSecret(secret);}).catch(error=>{if(alive)setIdentityError(error.message);});const timer=setInterval(()=>setDay(openingDay(Date.now())),30000);return()=>{alive=false;clearInterval(timer);};},[]);
 useEffect(()=>{const stop=()=>{revision.current++;controller.current?.abort();capture.current?.cancel();capture.current=null;};window.addEventListener('pagehide',stop);return()=>{stop();window.removeEventListener('pagehide',stop);};},[]);
 useEffect(()=>{if(isAuthenticated){revision.current++;controller.current?.abort();capture.current?.cancel();capture.current=null;setPhase('idle');}},[isAuthenticated]);
 const exhausted=allowance?.remaining===0;
 useEffect(()=>{
  const sync=()=>{try{if(allowance&&allowance.remaining>0){localStorage.removeItem(limitStorageKey);setLimitShown(false);}else setLimitShown(localStorage.getItem(limitStorageKey)===day);}catch{}};
  sync();const change=(event:StorageEvent)=>{if(event.key===limitStorageKey)sync();};window.addEventListener('storage',change);return()=>window.removeEventListener('storage',change);
 },[day,allowance?.remaining,limitStorageKey]);
 useEffect(()=>{if(limitShown)limitAction.current?.focus();},[limitShown]);
 function showLimit(){capture.current?.cancel();capture.current=null;controller.current?.abort();setPhase('idle');setMessage('');setLimitShown(true);try{localStorage.setItem(limitStorageKey,day);}catch{}}

 function fail(text:string,id:number){if(id!==revision.current)return;controller.current?.abort();capture.current?.cancel();capture.current=null;setPhase('idle');setMessage(text);}
 async function speak(){
  if(phase==='listening'){
   if(exhausted){showLimit();return;}
   const id=revision.current;setPhase('answering');setMessage('Finding your answer…');
   try{const audio=await capture.current!.stop();capture.current=null;const response=await ask({browserSecret,requestKey:crypto.randomUUID(),audio});if(id!==revision.current)return;setResult(response);setAnswerArrival(response.bullets.length>0);setMessage('');}
   catch(error){if(id===revision.current)setMessage(error instanceof ConvexError&&typeof error.data==='string'?error.data:'Your answer could not load. Please try again.');}
   finally{if(id===revision.current)setPhase('idle');}return;
  }
  if(!allowance||(!allowance.enabled&&!exhausted)||allowance.busy||isAuthenticated||limitShown)return;
  setAnswerArrival(false);const id=++revision.current;controller.current=new AbortController();setPhase('requesting');setMessage('Allow microphone access to ask your question.');
  try{capture.current=await startQuestionCapture({signal:controller.current.signal,onInterrupted:()=>fail('Your microphone disconnected. Reconnect it and try again.',id),onLimit:()=>fail('Please keep your question under 20 seconds.',id)});if(id!==revision.current){capture.current.cancel();return;}setPhase('listening');setMessage('Listening. Tap Finish question when you’re ready.');}
  catch(error){fail(error instanceof Error&&error.name==='NotAllowedError'?'Microphone access is off. Allow it in Chrome to speak to Cuelo.':error instanceof Error?error.message:'Your microphone could not start.',id);}
 }
 return <>
 <div className={`conversation-stage ${phase==='listening'?'is-listening':''} ${answerArrival&&phase==='idle'&&!limitShown?'is-answer-ready':''}`}>
 <div className="blob-area"><div className="blob-handle" aria-hidden="true"><span className="cuelo-blob"><span className="blob-glint"/><span className="blob-face"><span className="blob-eye left-eye"/><span className="blob-eye right-eye"/></span></span></div><p className="blob-caption">Quiet by nature.</p></div>
 <section className={`welcome-card opening-answer-box ${limitShown?'has-limit':''}`} aria-labelledby={limitShown?'opening-limit-heading':'welcome-heading'} aria-live="polite" aria-busy={phase==='answering'}>
 <div className="opening-answer-content" inert={limitShown||undefined} aria-hidden={limitShown||undefined}>
 <div className="card-presence"><span aria-hidden="true"/>Cuelo</div>
 <h2 id="welcome-heading">{phase==='listening'?<>Listening<span className="listening-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></>:phase==='requesting'?'A moment for your mic…':phase==='answering'?<>Finding your answer<span className="listening-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></>:result?.shorteningTimedOut?'Check the source.':result?'Here’s your answer.':'Try Cuelo.'}</h2>
 {phase==='listening'?<p className="opening-listening-help">Tap Finish question when you’re ready.</p>:phase==='requesting'?<p>Allow microphone access to ask your question.</p>:phase==='answering'?null:result?<>{result.question&&<p className="opening-question">{result.question}</p>}{result.bullets.length>0&&<ul>{result.bullets.map((line,index)=><li key={index}>{line}</li>)}</ul>}{result.message&&<p>{result.message}</p>}{result.mode==='generic'&&result.sourceUnverified&&<p className="public-source-unverified"><span aria-hidden="true">⚠</span> Source not verified</p>}{!!result.webSources?.length&&<p className="public-answer-sources">{checkedWebSources(result.webSources).map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</p>}{result.shorteningTimedOut&&result.source&&<p className="public-answer-sources"><a href={`/?view=content&source=${encodeURIComponent(result.source.id)}`} target="_blank" rel="noreferrer">{result.source.title} ↗</a></p>}{!result.shorteningTimedOut&&result.citations.length>0&&<details><summary>See supporting passage</summary>{result.citations.map(p=><div key={p.ordinal}><strong>{p.reference}</strong><p>{p.text}</p></div>)}<p>{result.source?.title}</p></details>}</>:<p>Ask a question out loud.<br/>Get a short answer here.</p>}
 <div className="opening-card-controls">
 {isAuthenticated?<a className="voice-action" href="/?view=account">Use Cuelo in a call</a>:<button className="voice-action" type="button" onClick={()=>{void speak();}} disabled={phase==='requesting'||phase==='answering'||phase!=='listening'&&(!allowance||!allowance.enabled&&!exhausted||allowance.busy)}><MicIcon/>{phase==='listening'?'Finish question':phase==='requesting'?'Opening microphone…':'Speak to Cuelo'}</button>}
 {(phase==='listening'||phase==='requesting')&&<button className="text-button" onClick={()=>{revision.current++;controller.current?.abort();capture.current?.cancel();capture.current=null;setPhase('idle');setMessage('');}}>Cancel</button>}
 </div>
 {(identityError||phase==='idle'&&message||allowance?.busy&&phase==='idle')&&<p className="supporting opening-feedback" role="status">{identityError||message||'Cuelo is answering a question in another tab. Please wait.'}</p>}
 </div>
 {limitShown&&<div className="opening-limit-overlay"><div className="opening-limit-eyebrow"><span className="limit-spark" aria-hidden="true">✦</span><span>Your free questions have flown by</span></div><h2 id="opening-limit-heading">Keep the conversation going.</h2><p>Create your free Cuelo account to continue.</p><a className="voice-action" ref={limitAction} href="/?view=account&intent=signup">Try Cuelo for free</a></div>}
 </section></div>
 </>;
}
