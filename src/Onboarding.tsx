import {CueloWordmark} from './CueloWordmark';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useMutation,usePaginatedQuery} from 'convex/react';
import {ConvexError} from 'convex/values';
import type {FunctionReturnType} from 'convex/server';
import {api} from '../convex/_generated/api';
import {useAuthActions} from './auth/SharedAuth';
import {websiteTransport} from './auth/transport';
import {CUELO_CHROME_STORE_URL} from './CallDownloads';
import {WorkspaceIcon,sourceLabel} from './Workspace';
import {ContentEditor} from './ContentLibrary';
import {SignInLoader} from './SignInLoader';
import type {ReactNode} from 'react';
type Overview=FunctionReturnType<typeof api.dashboard.overview>;
function message(error:unknown){return error instanceof ConvexError&&typeof error.data==='string'?error.data:'Could not save your progress. Check your connection and try again.';}

export function OnboardingDetails({name}:{name:string}){
 const save=useMutation(api.onboarding.saveDetails),{signOut}=useAuthActions();const [role,setRole]=useState(''),[company,setCompany]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');try{await save({role,company});}catch(e){setError(message(e));}finally{setBusy(false);}}
 async function leave(){setBusy(true);setError('');try{await signOut();location.assign('/');}catch{setError('Could not sign out. Please try again.');setBusy(false);}}
 return <main className="welcome-onboarding"><header className="welcome-header"><a href="/" className="welcome-wordmark"><CueloWordmark/></a><button onClick={()=>void leave()} disabled={busy}>Sign out</button></header><section className="welcome-details glass-panel"><div className="welcome-greeting">Good to meet you{name&&name!=='Cuelo user'?`, ${name.split(' ')[0]}`:''}.</div><h1>A little about you.</h1><p>Tell us your role and company to get your Cuelo account ready.</p><form onSubmit={e=>void submit(e)}><label htmlFor="onboarding-role">Your role</label><input id="onboarding-role" value={role} onChange={e=>setRole(e.target.value)} required maxLength={120} disabled={busy} autoComplete="organization-title" placeholder="e.g. Account executive"/><label htmlFor="onboarding-company">Company name</label><input id="onboarding-company" value={company} onChange={e=>setCompany(e.target.value)} required maxLength={160} disabled={busy} autoComplete="organization" placeholder="Your company"/>{error&&<p role="alert" className="workspace-error">{error}</p>}<button className="workspace-primary" disabled={busy||!role.trim()||!company.trim()}>{busy?'Saving…':'Continue'}<WorkspaceIcon name="arrow"/></button></form></section></main>;
}
export function TrialAllowance({trial}:{trial:Overview['trial']}){
 return <section className="workspace-trial glass-panel" aria-label="Free trial"><div><h2>Your free trial</h2><p>{trial.exhausted?'Your free trial has ended. Paid plans are coming soon.':`${trial.callsRemaining} ${trial.callsRemaining===1?'call':'calls'} and ${Math.ceil(trial.remainingMs/60000)} minutes remaining. Whichever runs out first.`}</p></div><span className="trial-badge">3 calls / 90 minutes</span></section>;
}
function useExtensionCheck(){
 const [status,setStatus]=useState<'checking'|'installed'|'missing'>('checking');
 const alive=useRef(true),pending=useRef(false),detected=useRef(false);
 const check=useCallback(async()=>{if(pending.current)return;pending.current=true;const backend=import.meta.env?.VITE_CONVEX_URL;
 try{if(!backend)throw Error('No backend');await websiteTransport(backend).request({operation:'probe'});if(alive.current){setStatus('installed');if(!detected.current){detected.current=true;window.dispatchEvent(new Event('cuelo-extension-connected'));}}}
 catch{detected.current=false;if(alive.current)setStatus('missing');}finally{pending.current=false;}},[]);
 useEffect(()=>{alive.current=true;void check();
 const visible=()=>{if(document.visibilityState==='visible')void check();};
 const interval=window.setInterval(visible,3000);
 window.addEventListener('focus',visible);document.addEventListener('visibilitychange',visible);
 return()=>{alive.current=false;clearInterval(interval);window.removeEventListener('focus',visible);document.removeEventListener('visibilitychange',visible);};},[check]);
 return {status,check};
}
type ExtensionStatus='checking'|'installed'|'missing';
function ChromeDownload({status}:{status:ExtensionStatus}){
 const development=import.meta.env?.VITE_CONVEX_URL?.includes('calculating-gecko-263');
 if(status!=='installed'&&development)return <div className="download-platform development-install"><strong>Cuelo for Chrome</strong><span>Use Cuelo — development for this test.</span><p>In <code>chrome://extensions</code>, choose Load unpacked and select <code>build-sprint-app/extension/meet</code>.</p></div>;
 return status==='installed'?<button className="download-platform" disabled><span className="platform-icon"><WorkspaceIcon name="integrations"/></span><strong>Cuelo for Chrome</strong><span>Installed</span></button>:<a className="download-platform available" href={CUELO_CHROME_STORE_URL} target="_blank" rel="noreferrer"><span className="platform-icon"><WorkspaceIcon name="integrations"/></span><strong>Cuelo for Chrome</strong><span className="platform-action">Add to Chrome <WorkspaceIcon name="arrow"/></span></a>;
}
export function HomeExperience({data,children}:{data:Overview;children:ReactNode}){
 const {status}=useExtensionCheck();
 const [step,setStep]=useState<'install'|'content'|'call'>('content');
 if(data.analyticsUnlocked)return <>{status==='missing'&&<section className="glass-panel extension-reminder" aria-label="Restore Cuelo"><div><h2>Bring Cuelo back to your browser.</h2><p>Add the Chrome extension again to use Cuelo on your next call. Your saved content and analytics are still available.</p></div><ChromeDownload status={status}/></section>}{children}</>;
 if(status==='checking')return <SignInLoader message="Finding your quiet assistant…"/>;
 if(status==='missing'&&data.onboarding.extensionSeen)return <><header className="workspace-heading"><h1>Bring Cuelo back to your browser.</h1><p>Add the Chrome extension again to continue. Your content and progress are still here.</p></header><TrialAllowance trial={data.trial}/><section className="glass-panel extension-restore" aria-label="Restore Cuelo"><ChromeDownload status={status}/><p role="status">We’ll continue automatically once Cuelo connects.</p></section></>;
 return <GuidedHome data={data} status={status} step={status==='installed'?step:'install'} onStep={setStep}/>;
}
export function GuidedHome({data,status,step,onStep}:{data:Overview;status:ExtensionStatus;step:'install'|'content'|'call';onStep:(step:'install'|'content'|'call')=>void}){
 const advance=useMutation(api.onboarding.advance);const [busy,setBusy]=useState(false),[error,setError]=useState(''),[editor,setEditor]=useState(false);
 const {results:sources,status:contentStatus,loadMore}=usePaginatedQuery(api.sourceLibrary.list,{}, {initialNumItems:50});
 useEffect(()=>{if(contentStatus==='CanLoadMore')loadMore(50);},[contentStatus,loadMore]);
 const hasContent=sources.length>0;
 const loadingContent=contentStatus!=='Exhausted';
 const [mode,setMode]=useState<'generic'|'document'|null>(data.onboarding.contentMode);const syncing=useRef(false);
 useEffect(()=>{
  if(status!=='installed'||syncing.current||data.onboarding.extensionSeen)return;
  syncing.current=true;
  void advance({step:'content',extensionSeen:true}).catch(e=>setError(message(e))).finally(()=>{syncing.current=false;});
 },[status,data.onboarding.extensionSeen,advance]);
 async function go(next:'install'|'content'|'call'){setBusy(true);setError('');try{await advance({step:next,...(status==='installed'?{extensionSeen:true}:{}),...(mode?{contentMode:mode}:{})});onStep(next);}catch(e){setError(message(e));}finally{setBusy(false);}}
 function chooseDocument(){setMode('document');setEditor(true);}
 return <><header className="workspace-heading"><h1>Your first call starts here.</h1><p>Let’s get Cuelo ready, one step at a time.</p></header><TrialAllowance trial={data.trial}/><section className="glass-panel first-call-guide" aria-label="First call setup"><nav className="guide-steps" aria-label="Setup steps">{([['install','Get Cuelo'],['content','Choose your knowledge'],['call','Your first call']] as const).map(([value,label],index)=><button key={value} aria-current={step===value?'step':undefined} disabled={busy||value==='install'&&status==='installed'||value!=='install'&&status!=='installed'||value==='call'&&step!=='call'} onClick={()=>void go(value)}><span className={value==='install'&&status==='installed'?'guide-complete':''}>{value==='install'&&status==='installed'?<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Completed"><path d="m5 12 4 4L19 6"/></svg>:index+1}</span>{label}</button>)}</nav>
 {step==='install'?<div className="guide-body"><h2>Bring Cuelo to your browser.</h2><p>Choose how you’d like to use Cuelo.</p><div className="onboarding-downloads"><ChromeDownload status={status}/><button className="download-platform" disabled><strong>Cuelo for Mac</strong><span>Coming soon</span></button><button className="download-platform" disabled><strong>Cuelo for Windows</strong><span>Coming soon</span></button></div><p role="status" className="guide-small">We’ll continue automatically once Cuelo connects.</p></div>
 :step==='content'?<div className="guide-body"><h2>What should Cuelo know?</h2><p>Start with general knowledge, or bring your product information into the conversation.</p><fieldset className="guide-mode-options"><legend className="sr-only">Choose your starting point</legend><label className={mode==='generic'?'selected':''}><input type="radio" name="onboarding-mode" checked={mode==='generic'} onChange={()=>setMode('generic')}/><span><strong>Start with general knowledge</strong><small>No content needed. Answers will be marked “Not from your document”.</small></span></label><label className={mode==='document'?'selected':''}><input type="radio" name="onboarding-mode" checked={mode==='document'} onChange={chooseDocument}/><span><strong>Use my content</strong><small>Add a PDF, Word document, pasted text or public link. Choose sources in the extension.</small></span></label></fieldset>{mode==='document'&&<div className="guide-content-action"><h3>Your saved sources</h3><p>{hasContent?'These sources are saved to your account. Choose which to use in the extension for your call.':'Add your content here, then continue to your first call.'}</p>{loadingContent&&<p role="status">Loading your saved sources…</p>}{hasContent&&<ul className="guide-source-list" aria-label="Saved sources">{sources.map(source=><li key={source.id}><WorkspaceIcon name="content"/><span>{source.title}</span><small>{sourceLabel(source.kind)}</small></li>)}</ul>}<button className="workspace-secondary" disabled={busy} onClick={()=>setEditor(true)}>{hasContent?'Add more content':'Add content'}</button></div>}<div className="guide-actions"><button className="workspace-primary" disabled={busy||!mode||mode==='document'&&!hasContent} onClick={()=>void go('call')}>Continue <WorkspaceIcon name="arrow"/></button></div></div>
 :<div className="guide-body"><h2>Your first call with Cuelo.</h2><p>Choose where you’re meeting.</p><div className="onboarding-downloads call-platforms"><a className="download-platform available" href="https://meet.google.com/" target="_blank" rel="noreferrer"><strong>Google Meet</strong><span className="platform-action">Open Google Meet <WorkspaceIcon name="arrow"/></span></a><button className="download-platform" disabled><strong>Zoom</strong><span>Coming soon</span></button><button className="download-platform" disabled><strong>Microsoft Teams</strong><span>Coming soon</span></button></div><ol className="call-walkthrough"><li><span>1</span><div><h3>Start your call</h3><p>Start or join a Google Meet call in Chrome.</p></div></li><li><span>2</span><div><h3>Open the Cuelo extension</h3><p>Click Chrome’s Extensions button, then Cuelo. Continue in the side panel.</p></div></li></ol><button className="workspace-text-button" disabled={busy} onClick={()=>void go('content')}>Back to your knowledge</button></div>}
 {error&&<p className="workspace-error guide-error" role="alert">{error}</p>}</section>{editor&&<ContentEditor entry={null} onClose={()=>setEditor(false)} onSaved={()=>setEditor(false)}/>}</>;
}
