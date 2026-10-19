import {checkedWebSources} from '../convex/publicAnswerPolicy';
import {sourceEvidenceLink,type SourceWebsite} from './answerEvidence';
import {Topbar} from "./Topbar";
import {useCallback,useEffect,useRef,useState} from 'react';
import {useAction,useMutation,useQuery} from 'convex/react';
import type {FunctionReturnType} from 'convex/server';
import {api} from '../convex/_generated/api';
import {SourceManager,getSourceVisitSecret} from './SourceManager';
type Source=NonNullable<FunctionReturnType<typeof api.sources.get>>;
type Result=FunctionReturnType<typeof api.selectedAnswers.ask>;
type Selection={source:Source;guestSecret?:string};
export function AnswerCard({result,elapsedMs,sourceLinks=true,sourceWebsite}:{result:Omit<Result,'citations'>&{citations:Array<Result['citations'][number]&{sourceId?:string;sourceTitle?:string}>;bulletCitations?:number[][]};elapsedMs?:number;sourceLinks?:boolean;sourceWebsite?:SourceWebsite}){
 const groups:Array<{link:NonNullable<ReturnType<typeof sourceEvidenceLink>>;passages:typeof result.citations}>=[];
 if(sourceWebsite)for(const passage of result.citations){const link=sourceEvidenceLink(passage,result.source,sourceWebsite);if(!link)continue;const group=groups.find(g=>g.link.id===link.id);if(group){group.passages.push(passage);group.link.inline=group.link.inline&&link.inline;}else groups.push({link,passages:[passage]});}
 const inlineGroups=groups.filter(g=>g.link.inline);
 return <section className="answer-panel selected-answer-card" aria-label="Answer" aria-live="polite">
 <h2>Cuelo’s answer</h2>
 {result.mode==='generic'&&<p className="provenance">Not from your document</p>}
 {result.bullets.length>0&&<ul className="answer">{result.bullets.map((text,i)=><li key={i}>{text}{result.bulletCitations?.[i]&&<small className="answer-bullet-citations">{sourceWebsite?[...new Map(result.bulletCitations[i].map(id=>result.citations.find(p=>p.ordinal===id)).filter(Boolean).map(p=>sourceEvidenceLink(p!,result.source,sourceWebsite)).filter(Boolean).map(link=>[link!.id,link!] as const)).values()].map(link=><a key={link.id} href={link.href} target="_blank" rel="noreferrer">{link.title}</a>):[...new Set(result.bulletCitations[i].map(id=>result.citations.find(p=>p.ordinal===id)).filter(Boolean).map(p=>`${p!.reference} · ${p!.sourceTitle??result.source?.title??''}`))].join('; ')}</small>}</li>)}</ul>}
 {result.message&&<p className={result.status==='error'?'error':''} role={result.status==='error'?'alert':undefined}>{result.message}</p>}
 {result.mode==='generic'&&result.sourceUnverified&&<p className="public-source-unverified"><span aria-hidden="true">⚠</span> Source not verified</p>}{result.mode==='generic'&&!!result.webSources?.length&&<p className="public-answer-sources">{checkedWebSources(result.webSources).map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</p>}
 {result.mode==='document'&&result.source&&result.citations.length>0&&<>
 {sourceWebsite?<>
 <p className="citation citation-source-link">{groups.length?groups.map(({link})=><a key={link.id} href={link.href} target="_blank" rel="noreferrer">{link.title}<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M14 3h7v7M21 3 10 14M10 3H3v18h18v-7"/></svg></a>):'Source unavailable.'}</p>
 {!result.shorteningTimedOut&&inlineGroups.length>0&&<details><summary>Open supporting passage</summary>{inlineGroups.map(({link,passages})=><div key={link.id}><p className="citation-source-link"><a href={link.href} target="_blank" rel="noreferrer">{link.title}</a></p>{passages.map(p=><blockquote key={p.ordinal}>{p.text}</blockquote>)}</div>)}</details>}
 </>:<>
 <p className="citation">{[...new Set(result.citations.map(p=>p.sourceTitle?`${p.reference} · ${p.sourceTitle}`:p.reference))].join(', ')}{!result.citations.some(p=>p.sourceTitle)&&<><br/>{result.shorteningTimedOut?<a href={`/?view=content&source=${encodeURIComponent(result.source.id)}`} target="_blank" rel="noreferrer">{result.source.title}</a>:sourceLinks&&result.source.url?<a href={result.source.url} target="_blank" rel="noreferrer">{result.source.title}</a>:result.source.title}</>}</p>
 {!result.shorteningTimedOut&&<details><summary>Open supporting passage</summary>{result.citations.map(p=><div key={p.ordinal}><h3>{p.reference}</h3><blockquote>{p.text}</blockquote>{p.sourceTitle&&<p className="citation-source-name">{p.sourceTitle}</p>}</div>)}</details>}
 </>}

 </>}
 {result.status!=='error'&&result.status!=='cancelled'&&<p className="timing">Measured response: {((elapsedMs??result.elapsedMs)/1000).toFixed(1)} seconds</p>}
 {result.budgetAlert&&<p className="supporting">The testing budget is nearly used up.</p>}
 </section>;
}
export function AnswerCheck(){
 const [visitSecret]=useState(getSourceVisitSecret);
 const allowance=useQuery(api.selectedAnswerBudget.status,{visitSecret});
 const ask=useAction(api.selectedAnswers.ask),cancel=useMutation(api.selectedAnswerBudget.cancel);
 const [mode,setMode]=useState<'generic'|'document'|null>(null),[selection,setSelection]=useState<Selection|null>(null);
 const selectionRef=useRef<Selection|null>(null);const generation=useRef(0),pending=useRef<string|null>(null);
 const [question,setQuestion]=useState(''),[busy,setBusy]=useState(false),[result,setResult]=useState<Result|null>(null),[elapsed,setElapsed]=useState<number|undefined>();
 const [notice,setNotice]=useState('');
 const invalidate=useCallback(()=>{generation.current++;const key=pending.current;pending.current=null;if(key)void cancel({visitSecret,requestKey:key}).catch(()=>{});setResult(null);setBusy(false);setElapsed(undefined);},[cancel,visitSecret]);
 useEffect(()=>()=>{generation.current++;const key=pending.current;if(key)void cancel({visitSecret,requestKey:key}).catch(()=>{});},[cancel,visitSecret]);
 const sourceChanged=useCallback((source:Source|null,scope:{guestSecret?:string})=>{
  const chosen=selectionRef.current;if(chosen&&(source?.id!==chosen.source.id||scope.guestSecret!==chosen.guestSecret)){selectionRef.current=null;setSelection(null);invalidate();setNotice('Your source changed. Confirm the source before asking again.');}
 },[invalidate]);
 function chooseMode(next:'generic'|'document'){invalidate();setMode(next);setNotice('');selectionRef.current=null;setSelection(null);}
 async function submit(event:React.FormEvent){event.preventDefault();if(!mode||!question.trim()||mode==='document'&&!selection)return;
  invalidate();const id=generation.current;const requestKey=crypto.randomUUID();pending.current=requestKey;setBusy(true);setNotice('');const started=performance.now();
  try{const response=await ask({mode,question,visitSecret,requestKey,...(mode==='document'&&selection?{sourceId:selection.source.id,guestSecret:selection.guestSecret}:{})});
   if(id===generation.current){setResult(response);setElapsed(performance.now()-started);}
  }catch{if(id===generation.current)setNotice('Your answer could not be loaded. Check your connection and try again.');}
  finally{if(id===generation.current){setBusy(false);pending.current=null;}}
 }
 return <><Topbar/>
 <main className="account-page answer-check-page"><h1>Ask a question. Check the evidence.</h1><p className="intro">Answer check only. Meeting audio and microphone are not connected.</p>
 <h2>How should Cuelo answer?</h2>
 <fieldset className="mode-options"><legend className="sr-only">Answer mode</legend>
 <label className={`mode-option ${mode==='generic'?'selected':''}`}><input type="radio" name="answer-mode" checked={mode==='generic'} onChange={()=>chooseMode('generic')}/><span><strong>Generic answers</strong><span>General knowledge. Not from your document.</span></span></label>
 <label className={`mode-option ${mode==='document'?'selected':''}`}><input type="radio" name="answer-mode" checked={mode==='document'} onChange={()=>chooseMode('document')}/><span><strong>Answers from my document</strong><span>Answers grounded in one source you confirm.</span></span></label>
 </fieldset>
 {mode==='document'&&<SourceManager onSourceChanged={sourceChanged} onConfirmed={(source,scope)=>{invalidate();const chosen={source,...scope};selectionRef.current=chosen;setSelection(chosen);setNotice(`Using ${source.title}.`);}}/>}
 {mode&&<form className="selected-question" onSubmit={submit}><label htmlFor="selected-question">Your question</label><textarea id="selected-question" value={question} rows={3} maxLength={1000} required onChange={event=>{invalidate();setQuestion(event.target.value);setNotice('');}}/>
 <button className="primary" disabled={!allowance?.enabled||allowance.remaining===0||allowance.attemptsRemaining===0||!question.trim()||mode==='document'&&!selection}>{busy?'Ask the new question':'Ask Cuelo'}</button>
 {busy&&<><p role="status">Finding the answer…</p><button type="button" className="text-button" onClick={()=>{invalidate();setNotice('Answer cancelled.');}}>Cancel answer</button></>}
 </form>}
 {mode&&allowance&&<p className="supporting">{allowance.remaining} of 5 generated answers remaining for this visit.</p>}
 {allowance&&!allowance.enabled&&<p className="setup-notice" role="status">Real answer testing is not enabled yet. No paid request will run.</p>}
 {allowance?.enabled&&allowance.attemptsRemaining===0&&<p role="status">The development answer allowance is used up. Paid requests have stopped.</p>}
 {allowance?.remaining===0&&<p role="status">You’ve used your five free answers. <a href="/?view=account">Sign up to continue.</a></p>}
 {notice&&<p role="status">{notice}</p>}{result&&<AnswerCard result={result} elapsedMs={elapsed}/>}
 <footer>Cuelo replies in text. Document answers keep their evidence; generic answers visibly say “Not from your document”.</footer>
 </main></>;
}
