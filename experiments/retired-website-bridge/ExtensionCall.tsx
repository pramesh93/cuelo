import {useEffect,useRef,useState} from 'react';
import {useAuthActions} from '@convex-dev/auth/react';
import {useAction,useConvexAuth,useMutation,useQuery} from 'convex/react';
import {ConvexError} from 'convex/values';
import type {FunctionReturnType} from 'convex/server';
import type {Id} from '../convex/_generated/dataModel';
import {api} from '../convex/_generated/api';
import {Topbar} from './Topbar';
import {AnswerCard} from './AnswerCheck';
import {connectLiveSpeech,type LiveSpeech} from './liveSpeech';
import {decodeMeetingFrame,validExtensionId,type ExtensionMode} from './extensionProtocol';
type Listener<T>={addListener:(listener:(message:T)=>void)=>void};
type Message={type:string;action?:string;mode?:ExtensionMode;sourceId?:string;requestId?:number;ok?:boolean;message?:string;frame?:unknown;runId?:string;sequence?:number};
type Port={postMessage:(message:unknown)=>void;disconnect:()=>void;onMessage:Listener<Message>;onDisconnect:Listener<void>};
type ChromeBridge={runtime?:{connect:(extensionId:string,options:{name:string})=>Port}};
type Answer=FunctionReturnType<typeof api.liveAnswers.answer>;
export function ExtensionCall(){
 const extensionId=new URLSearchParams(location.search).get('extensionId');
 const {isAuthenticated,isLoading}=useConvexAuth(),{signIn}=useAuthActions();
 const access=useQuery(api.liveCalls.availability,{}),source=useQuery(api.sources.get,isAuthenticated?{}:'skip');
 const startSession=useMutation(api.liveCalls.start),change=useMutation(api.liveCalls.change),heartbeat=useMutation(api.liveCalls.heartbeat),append=useMutation(api.liveCalls.append),invalidate=useMutation(api.liveCalls.invalidate),credential=useAction(api.liveSpeech.connect),answer=useAction(api.liveAnswers.answer);
 const [state,setState]=useState<'idle'|'connecting'|'listening'|'paused'>('idle'),[message,setMessage]=useState('Connect Cuelo’s sidebar, then return to your Meet tab.'),[connected,setConnected]=useState(false),[controlsBusy,setControlsBusy]=useState(false),[busy,setBusy]=useState(false),[result,setResult]=useState<Answer|null>(null),[warning,setWarning]=useState(false),[sessionId,setSessionId]=useState<Id<'liveCalls'>|null>(null);
 const session=useQuery(api.liveCalls.get,sessionId?{sessionId}:'skip');
 const port=useRef<Port|null>(null),mic=useRef<MediaStream|null>(null),speech=useRef<LiveSpeech|null>(null),controller=useRef<AbortController|null>(null),id=useRef<Id<'liveCalls'>|null>(null),deadline=useRef(0),generation=useRef(0),epoch=useRef(0),answerEpoch=useRef(0),currentState=useRef(state),ending=useRef(false),frameReceiver=useRef<((frame:ArrayBuffer)=>void)|null>(null),rpcSequence=useRef(0),heartbeatPending=useRef(false),chosenMode=useRef<ExtensionMode|null>(null),chosenTitle=useRef<string|null>(null),stopAfterCleanup=useRef<string|null>(null);
 const pending=useRef(new Map<number,{resolve:()=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>());
 const commands=useRef<(message:Message)=>void>(()=>{});
 const explain=(error:unknown)=>error instanceof ConvexError&&typeof error.data==='string'?error.data:error instanceof Error?error.message:'Cuelo could not connect. Try again.';
 const updateState=(value:typeof state)=>{currentState.current=value;setState(value);};
 function post(value:unknown){if(!port.current)throw Error('Cuelo extension disconnected.');port.current.postMessage(value);}
 function rpc(type:string,extra:Record<string,unknown>={}){return new Promise<void>((resolve,reject)=>{const requestId=++rpcSequence.current;const timer=setTimeout(()=>{pending.current.delete(requestId);reject(Error('Meeting audio connection took too long.'));},15000);pending.current.set(requestId,{resolve,reject,timer});try{post({type,requestId,...extra});}catch(error){clearTimeout(timer);pending.current.delete(requestId);reject(error);}});}
 async function finish(paused=false,notice=paused?'Paused. Meeting audio and microphone are off.':'Stopped. Meeting audio and microphone are off.'){
  if(ending.current){if(!paused)stopAfterCleanup.current=notice;return;}ending.current=true;setControlsBusy(true);epoch.current++;answerEpoch.current++;controller.current?.abort();controller.current=null;speech.current?.stop();speech.current=null;frameReceiver.current=null;mic.current?.getTracks().forEach(track=>track.stop());mic.current=null;setBusy(false);setResult(null);setWarning(false);
  const session=id.current;updateState(paused&&session?'paused':'idle');setMessage(notice);if(!paused){id.current=null;setSessionId(null);deadline.current=0;}
  const cleanup=port.current?rpc('capture-stop',{message:notice}).catch(()=>{}):Promise.resolve();
  try{await Promise.all([cleanup,session?change({sessionId:session,state:paused?'paused':'stopped'}):Promise.resolve()]);}catch{setMessage('Audio is off. Server cleanup could not be confirmed; temporary text will expire.');}finally{ending.current=false;setControlsBusy(false);if(stopAfterCleanup.current){const queuedNotice=stopAfterCleanup.current;stopAfterCleanup.current=null;void finish(false,queuedNotice);}}
 }
 async function begin(command:Message){
  if(ending.current||currentState.current==='connecting'||currentState.current==='listening')return;
  const resume=command.action==='resume';if(resume&&(!id.current||currentState.current!=='paused')){setMessage('This session ended. Start a new call.');updateState('idle');return;}
  if(!access?.signedIn||!access.invited||!access.enabled){setMessage('Live calls require sign-in, invited access and an available testing allowance.');return;}
  if(!resume&&(command.mode!=='generic'&&command.mode!=='document'||command.mode==='document'&&command.sourceId!==source?.id)){setMessage('Select your answer mode and current saved source in the sidebar.');return;}
  const run=++epoch.current;const abort=new AbortController();controller.current=abort;updateState('connecting');setResult(null);setMessage('Allow Cuelo’s microphone if Chrome asks, then return to your Meet tab.');
  const cancelled=()=>abort.signal.aborted||run!==epoch.current;
  try{
   const input=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});
   if(cancelled()){input.getTracks().forEach(track=>track.stop());return;}mic.current=input;
   input.getAudioTracks().forEach(track=>track.addEventListener('ended',()=>{if(!abort.signal.aborted)void finish(false,'Microphone disconnected. Cuelo stopped.');},{once:true}));
   if(resume)await change({sessionId:id.current!,state:'active'});
   else {chosenMode.current=command.mode!;chosenTitle.current=command.mode==='document'?source!.title:null;const admitted=await startSession({mode:command.mode!,...(command.mode==='document'?{sourceId:source!.id}:{})});if(cancelled()){await change({sessionId:admitted.sessionId,state:'stopped'});return;}id.current=admitted.sessionId;deadline.current=admitted.deadline;setSessionId(admitted.sessionId);if(admitted.budgetAlert)setMessage('The testing budget is nearly used up.');}
   if(cancelled())return;const call=id.current!;
   const grant=await credential({sessionId:call});if(cancelled())return;if(!grant.token)throw Error(grant.message);generation.current=grant.generation;
   const live=await connectLiveSpeech({capture:{microphone:input},customerFrames:receive=>{frameReceiver.current=receive;return()=>{if(frameReceiver.current===receive)frameReceiver.current=null;};},token:grant.token,signal:abort.signal,
    onFailure:notice=>{void finish(false,notice);},onCustomerSpeech:()=>{if(abort.signal.aborted||id.current!==call)return;answerEpoch.current++;setResult(null);setBusy(false);void invalidate({sessionId:call}).catch(error=>{void finish(false,explain(error));});},
    onTurn:async(speaker,text)=>{if(abort.signal.aborted||id.current!==call)return;const stored=await append({sessionId:call,generation:generation.current,speaker,text});if(speaker==='salesperson')return;const request=++answerEpoch.current;setResult(null);setBusy(true);
     void answer({sessionId:call,utteranceId:stored.utteranceId}).then(response=>{if(request!==answerEpoch.current||abort.signal.aborted)return;if(response.status==='error'){void finish(false,response.message);return;}if(response.status!=='cancelled')setResult(response);}).catch(error=>{if(request===answerEpoch.current)void finish(false,explain(error));}).finally(()=>{if(request===answerEpoch.current)setBusy(false);});
    }});
   if(cancelled()){live.stop();return;}speech.current=live;
   await rpc('capture-start',{deadline:deadline.current});if(cancelled())return;
   updateState('listening');setMessage('Listening for customer questions. Your microphone adds context only.');
  }catch(error){if(!cancelled())await finish(false,explain(error));}
 }
 commands.current=m=>{
  if(m.type==='reply'&&typeof m.requestId==='number'){const request=pending.current.get(m.requestId);if(request){clearTimeout(request.timer);pending.current.delete(m.requestId);if(m.ok)request.resolve();else request.reject(Error(m.message??'Meeting audio failed.'));}return;}
  if(m.type==='frame'){if(!controller.current||controller.current.signal.aborted||!frameReceiver.current)return;try{frameReceiver.current(decodeMeetingFrame(m.frame));if(!controller.current.signal.aborted)post({type:'ack',runId:m.runId,sequence:m.sequence});}catch{void finish(false,'Meeting audio became unreadable. Cuelo stopped.');}return;}
  if(m.type==='meeting-ended'){void finish(false,m.message??'Meeting ended. Cuelo stopped.');return;}
  if(m.type!=='command')return;if(m.action==='start'||m.action==='resume')void begin(m);else if(m.action==='pause')void finish(true);else if(m.action==='stop')void finish();
 };
 useEffect(()=>{
  if(!validExtensionId(extensionId))return;const chrome=(window as unknown as {chrome?:ChromeBridge}).chrome;if(!chrome?.runtime?.connect){setMessage('Open this page using Connect Cuelo in the installed extension.');return;}
  let disposed=false,retry:ReturnType<typeof setTimeout>|undefined;
  const connect=()=>{if(disposed)return;try{const channel=chrome.runtime!.connect(extensionId,{name:'cuelo-live-v1'});port.current=channel;channel.onMessage.addListener(m=>{if(port.current!==channel)return;if(m.type==='connected'){setConnected(true);return;}commands.current(m);});channel.onDisconnect.addListener(()=>{if(port.current!==channel)return;port.current=null;setConnected(false);if(id.current||controller.current)void finish(false,'Extension disconnected. Cuelo stopped.');if(!disposed)retry=setTimeout(connect,2000);});}catch{if(!disposed)retry=setTimeout(connect,2000);}};
  connect();
  const leave=()=>{controller.current?.abort();speech.current?.stop();frameReceiver.current=null;mic.current?.getTracks().forEach(track=>track.stop());const session=id.current;id.current=null;if(session)void change({sessionId:session,state:'stopped'}).catch(()=>{});try{port.current?.postMessage({type:'capture-stop',message:'Cuelo page closed. Audio stopped.'});}catch{}};
  const offline=()=>{void finish(false,'Connection lost. Cuelo stopped.');};window.addEventListener('pagehide',leave);window.addEventListener('offline',offline);
  return()=>{disposed=true;clearTimeout(retry);window.removeEventListener('pagehide',leave);window.removeEventListener('offline',offline);leave();port.current?.disconnect();port.current=null;for(const request of pending.current.values()){clearTimeout(request.timer);request.reject(Error('Cuelo page closed.'));}pending.current.clear();};
 },[extensionId,change]);
 useEffect(()=>{if(!connected)return;try{post({type:'snapshot',view:{state,message,busy,controlsBusy,result,warning,mode:chosenMode.current,selectedSourceTitle:chosenTitle.current,signedIn:!!access?.signedIn,invited:!!access?.invited,enabled:!!access?.enabled,source:source?.saved?{id:source.id,title:source.title}:null}});}catch{void finish(false,'Extension disconnected. Cuelo stopped.');}},[connected,state,message,busy,controlsBusy,result,warning,access,source]);
 useEffect(()=>{if(isAuthenticated||isLoading)return;if(id.current||controller.current)void finish(false,'You signed out. Cuelo stopped.');},[isAuthenticated,isLoading]);
 useEffect(()=>{if(sessionId&&session===null)void finish(false,'This session ended. Cuelo stopped.');},[sessionId,session]);
 useEffect(()=>{if(!sessionId)return;const check=()=>{const remaining=deadline.current-Date.now();if(remaining<=0)void finish(false,'The 60-minute limit was reached. Meet can continue.');else if(remaining<=300000)setWarning(true);};check();const timer=setInterval(check,1000);const visibility=()=>check();document.addEventListener('visibilitychange',visibility);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visibility);};},[sessionId]);
 useEffect(()=>{if(!sessionId||state==='paused')return;const timer=setInterval(()=>{if(heartbeatPending.current)return;heartbeatPending.current=true;void heartbeat({sessionId}).catch(error=>{void finish(false,explain(error));}).finally(()=>{heartbeatPending.current=false;});},5000);return()=>clearInterval(timer);},[sessionId,state,heartbeat]);
 return <><Topbar/><main className="account-page"><h1>Cuelo is connected to your sidebar.</h1><p className="intro">Keep this tab open during your call. Questions and answers appear in the Cuelo sidebar beside Meet.</p>
 {!validExtensionId(extensionId)?<p role="alert">Open this page from the Cuelo extension to connect it.</p>:<>
 <p role="status">{connected?'Extension connected.':'Connecting to your installed Cuelo extension…'}</p>
 {isLoading?<p>Checking your sign-in…</p>:!isAuthenticated?<button className="primary" onClick={()=>{void signIn('google',{redirectTo:`/?view=extension&extensionId=${extensionId}`}).catch(()=>setMessage('Google sign-in failed. Try again.'));}}>Continue with Google</button>:<><p>You’re signed in. Return to Meet and choose your answer mode in the sidebar.</p><a href="/?view=sources" target="_blank" rel="noreferrer">Add or replace your saved source</a>{access&&!access.invited&&<p>Live calls are available to invited testers only.</p>}{access&&!access.enabled&&<p>Live listening testing is not enabled. No paid connection will start.</p>}</>}
 <p role="status">{message}</p>{warning&&<p role="status">Five minutes remain. Cuelo stops at 60 minutes; Meet continues.</p>}
 {(state!=='idle'||sessionId)&&<button type="button" className="cancel-button" onClick={()=>{void finish();}}>Stop Cuelo</button>}
 {busy&&<p>Finding the answer. Listening continues.</p>}{result&&<AnswerCard result={result}/>}</>}
 <footer>Meeting audio comes from the extension. Your microphone adds context; it does not trigger answers.</footer></main></>;
}
