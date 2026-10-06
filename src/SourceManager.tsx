import {Topbar} from "./Topbar";
import {useEffect,useState} from 'react';
import {useAction,useMutation,useQuery,useConvexAuth} from 'convex/react';
import {ConvexError} from 'convex/values';
import {api} from '../convex/_generated/api';
import type {FunctionReturnType} from 'convex/server';

type Meta=NonNullable<FunctionReturnType<typeof api.sources.get>>;
export function getSourceVisitSecret() {
 const key='cuelo-temporary-source';let value=sessionStorage.getItem(key);
 if(!value||!/^[a-f0-9]{64}$/.test(value)){value=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');sessionStorage.setItem(key,value);}return value;
}
export function SourceManager({savedOnly=false,onConfirmed,onSourceChanged}:{savedOnly?:boolean;onConfirmed?:(source:Meta,scope:{guestSecret?:string})=>void;onSourceChanged?:(source:Meta|null,scope:{guestSecret?:string})=>void}) {
 const {isAuthenticated}=useConvexAuth();
 const [secret]=useState(getSourceVisitSecret);
 const [kept,setKept]=useState(false),[preferGuest,setPreferGuest]=useState(false);
 const saved=useQuery(api.sources.get,isAuthenticated?{}:'skip');
 const temporary=useQuery(api.sources.get,{guestSecret:secret});
 const useGuest=savedOnly?Boolean(temporary&&(!saved||preferGuest)):!(kept&&isAuthenticated);
 const scope=useGuest?{guestSecret:secret}:{};
 const storedSource=useQuery(api.sources.get,scope);
 const [now,setNow]=useState(()=>Date.now());
 const source=storedSource&&storedSource.expiresAt!==null&&storedSource.expiresAt<=now?null:storedSource;
 const paste=useAction(api.sourceImport.paste),webpage=useAction(api.sourceImport.webpage),prepareUpload=useAction(api.sourceImport.prepareUpload);
 const remove=useMutation(api.sources.remove),keep=useMutation(api.sources.keep);
 const [method,setMethod]=useState<'text'|'file'|'webpage'>('text');
 const [title,setTitle]=useState(''),[text,setText]=useState(''),[url,setUrl]=useState(''),[file,setFile]=useState<File|null>(null);
 const [editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[inspect,setInspect]=useState(false);
 const passages=useQuery(api.sources.passages,inspect&&source?{...scope,id:source.id}:'skip');
 useEffect(()=>{setInspect(false);},[source?.id]);
 useEffect(()=>{const expiresAt=storedSource?.expiresAt;if(expiresAt!==null&&expiresAt!==undefined){const timer=setTimeout(()=>{setNow(Date.now());setInspect(false);},Math.max(0,expiresAt-Date.now()));return()=>clearTimeout(timer);}},[storedSource?.id,storedSource?.expiresAt]);
 useEffect(()=>{if(storedSource!==undefined)onSourceChanged?.(source??null,scope);},[source?.id,source?.expiresAt,useGuest,secret,onSourceChanged,storedSource===undefined]);
 function fail(error:unknown){setError(error instanceof ConvexError&&typeof error.data==='string'?error.data:error instanceof Error?error.message:'Your source could not be saved. Check your connection and try again.');}
 async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');setMessage('');
 try {const args={...scope,expectedId:source?.id??null};
 if(method==='text')await paste({...args,title,text});
 else if(method==='webpage')await webpage({...args,url});
 else {if(!file)throw new Error('Choose a PDF or Word .docx file.');if(file.size>10*1024*1024)throw new Error('Choose a file no larger than 10 MB.');const ticket=await prepareUpload({...args,name:file.name,size:file.size});const response=await fetch(ticket.url,{method:'POST',headers:{Authorization:`Bearer ${ticket.token}`,'Content-Type':'application/octet-stream'},body:file});const result=await response.json();if(!response.ok)throw new Error(result.error||'Your file could not be read. Try again.');}
 setEditing(false);setInspect(false);setText('');setFile(null);setMessage('Your source is ready. No answer has been generated.');
 }catch(error){fail(error);}finally{setBusy(false);}}
 async function deleteSource(){if(!source)return;setBusy(true);setError('');try{await remove({...scope,expectedId:source.id});setMessage('Source deleted, including its readable text and search entries.');setInspect(false);}catch(error){fail(error);}finally{setBusy(false);}}
 async function saveSource(){if(!source)return;setBusy(true);setError('');try{await keep({...scope,expectedId:source.id,replaceSaved:Boolean(saved&&saved.id!==source.id)});setKept(true);setPreferGuest(false);setMessage('Your source is saved to your account until you replace or delete it.');}catch(error){fail(error);}finally{setBusy(false);}}
 return <section className="source-manager" aria-label="Your source">
 <h2>{source?'Your source':'Add one source'}</h2>
 {savedOnly&&temporary&&saved&&temporary.id!==saved.id&&<button type="button" className="text-button" disabled={busy} onClick={()=>setPreferGuest(!preferGuest)}>{preferGuest?'Show account source':'Show the source from this visit'}</button>}
 <p className="supporting">One PDF, Word .docx file, pasted text or public webpage. Files: up to 10 MB and 50 pages. Readable text: up to 200,000 characters and 500 passages. Nothing is silently cut off.</p>
 {source===undefined?<p role="status">Checking your source…</p>:<>
 {source&&<div className="source-summary"><h3>{source.title}</h3><p>{source.passageCount} readable {source.passageCount===1?'passage':'passages'}{source.pageCount?` · ${source.pageCount} ${source.pageCount===1?'page':'pages'}${source.kind==='docx'?' reported by Word':''}`:''}</p>
 <p className="supporting">{source.saved?'Saved to your account until replaced or deleted.':'Temporary for this session. Expires after one hour; cleanup removes expired text.'}</p>
 <div className="source-actions"><button type="button" className="text-button" disabled={busy} onClick={()=>setInspect(!inspect)}>{inspect?'Hide readable text':'Inspect readable text'}</button><button type="button" className="text-button" disabled={busy} onClick={()=>{setEditing(true);setError('');}}>Replace source</button><button type="button" className="text-button" disabled={busy} onClick={deleteSource}>Delete source</button></div>
 {inspect&&<div className="source-preview">{passages===undefined?<p role="status">Loading readable text…</p>:passages.map(p=><div key={p.ordinal}><h3>{p.reference}</h3><p>{p.text}</p></div>)}</div>}
 {!source.saved&&(isAuthenticated?<button type="button" className="cancel-button" disabled={busy} onClick={saveSource}>{saved&&saved.id!==source.id?'Keep this source and replace saved source':'Keep this source'}</button>:<p className="supporting"><a href="/?view=account">Sign in with Google</a> to choose whether to keep this source.</p>)}
 {onConfirmed&&<button type="button" className="primary" disabled={busy} onClick={()=>onConfirmed(source,scope)}>Use this source</button>}
 </div>}
 {(!source||editing)&&<form onSubmit={submit}>
 <fieldset className="source-methods"><legend>How will you add your source?</legend>{([['text','Paste text'],['file','Upload file'],['webpage','Public webpage']] as const).map(([value,label])=><label key={value}><input type="radio" name="source-method" checked={method===value} disabled={busy} onChange={()=>{setMethod(value);setError('');}}/>{label}</label>)}</fieldset>
 {method==='text'?<><label htmlFor="source-name">Source name</label><input id="source-name" value={title} maxLength={160} required disabled={busy} onChange={e=>setTitle(e.target.value)}/><label htmlFor="source-text">Source text</label><textarea id="source-text" rows={7} value={text} required disabled={busy} onChange={e=>setText(e.target.value)}/></>:method==='webpage'?<><label htmlFor="source-link">Public webpage link</label><input id="source-link" type="url" value={url} maxLength={2048} required disabled={busy} placeholder="https://example.com/help/product" onChange={e=>setUrl(e.target.value)}/><p className="supporting">Cuelo reads this page only. Private pages and whole-site searches are outside this version.</p></>:<><label htmlFor="source-file">PDF or Word document</label><input id="source-file" type="file" accept=".pdf,.docx" required disabled={busy} onChange={e=>setFile(e.target.files?.[0]??null)}/><p className="supporting">Scans need a text-based PDF. Older .doc files need exporting as .docx or PDF. If Word’s saved page count is unavailable, export a PDF.</p></>}
 <p className="supporting">Your file is read to extract text; the original file is not kept. Temporary text is deleted when you delete it or when it expires. Signed-in sources are kept only when you choose to keep them.</p>
 <button className="primary" disabled={busy}>{busy?'Reading your source…':source?'Replace source':'Read source'}</button>{editing&&<button type="button" className="text-button" disabled={busy} onClick={()=>setEditing(false)}>Cancel replacement</button>}
 </form>}
 </>}
 {message&&<p role="status">{message}</p>}{error&&<p className="error" role="alert">{error}</p>}
 </section>;
}
export function SourcesPage(){return <><Topbar/><main className="account-page"><h1>Answers start with your source.</h1><p className="intro">Add a source and check its readable text. This step does not connect a call or generate answers.</p><SourceManager/><p><a href="/?view=answers">Try answers with your selected source</a></p><footer>Built for desktop Chrome. Cuelo replies in text.</footer></main></>;}
