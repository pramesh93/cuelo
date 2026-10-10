import {answerLimitReached,limitReachedView} from './answerLimit';
import {QuestionQueue} from './questionQueue';
import {emptyDiagnostics,recordDiagnostic,type AnswerDiagnostics} from './answerDiagnostics';
import {showAnswer} from './answerPanel';
import {useEffect,useRef,useState} from 'react';import {useAction,useMutation,useQuery,useConvexAuth} from 'convex/react';import {ConvexError} from 'convex/values';import type {Id} from '../../convex/_generated/dataModel';import type {FunctionReturnType} from 'convex/server';import {api} from '../../convex/_generated/api';import {connectLiveSpeech,type LiveSpeech} from '../../src/liveSpeech';import {preparePageAudio,type AudioStats} from './pageAudio';import {runtime,type RuntimeMessage} from './runtime';
export type CallView={state:'idle'|'connecting'|'listening'|'paused'|'limited';message:string;busy:boolean;controlsBusy:boolean;warning:boolean;mode:'generic'|'document'|null;sourceTitle:string|null;audioStats?:AudioStats;answerDiagnostics?:AnswerDiagnostics;answerNotice?:{question:string;message:string};questionQueue?:{checking:number;questions:string[];answering:boolean};previousAnswers:FunctionReturnType<typeof api.liveAnswers.answer>[];result:FunctionReturnType<typeof api.liveAnswers.answer>|null};
export const initialCallView:CallView={state:'idle',message:'Choose how Cuelo should answer, then Start.',busy:false,controlsBusy:false,warning:false,mode:null,sourceTitle:null,result:null,previousAnswers:[]};
export function CallEngine(){
 const {isAuthenticated,isLoading}=useConvexAuth();const access=useQuery(api.liveCalls.availability,isAuthenticated?{}:'skip');
 const start=useMutation(api.liveCalls.start),change=useMutation(api.liveCalls.change),heartbeat=useMutation(api.liveCalls.heartbeat),append=useMutation(api.liveCalls.append),credential=useAction(api.liveSpeech.connect),detect=useAction(api.liveAnswers.detectQueued),answer=useAction(api.liveAnswers.answerQueued);
 const answerLimit=useRef(0),completedAnswers=useRef(0);
 const queue=useRef<QuestionQueue<Id<'callText'>,FunctionReturnType<typeof api.liveAnswers.answerQueued>>|null>(null),actions=useRef({detect,answer});actions.current={detect,answer};
 const [view,setView]=useState<CallView>(initialCallView),viewRef=useRef(view);viewRef.current=view;const id=useRef<Id<'liveCalls'>|null>(null),deadline=useRef(0),deadlineMono=useRef(0),generation=useRef(0),epoch=useRef(0),answerEpoch=useRef(0),abort=useRef<AbortController|null>(null),capture=useRef<Awaited<ReturnType<typeof preparePageAudio>>|null>(null),speech=useRef<LiveSpeech|null>(null),ending=useRef(false),nextStop=useRef<string|null>(null);
 const update=(patch:Partial<CallView>)=>{const next={...viewRef.current,...patch};viewRef.current=next;setView(next);void runtime.sendMessage({type:'call-view',view:next}).catch(()=>{});};
 const diagnosticsEnabled=import.meta.env.VITE_CONVEX_URL?.includes('calculating-gecko-263');
 const diagnostic=(event:string,counter?:'speechStarts'|'requests'|'responses'|'displayed')=>{if(diagnosticsEnabled)update({answerDiagnostics:recordDiagnostic(viewRef.current.answerDiagnostics??emptyDiagnostics(),event,counter)});};
 const explain=(error:unknown)=>error instanceof ConvexError&&typeof error.data==='string'?error.data:error instanceof Error?error.message:'Cuelo could not connect. Try again.';
 async function finish(paused=false,message=paused?'Paused. Audio and transcription are off.':'Stopped. Audio and transcription are off.',limited=false){
  if(ending.current){if(!paused)nextStop.current=message;return;}ending.current=true;if(paused)queue.current?.pause();else {queue.current?.clear();queue.current=null;}epoch.current++;answerEpoch.current++;abort.current?.abort();abort.current=null;speech.current?.stop();speech.current=null;capture.current?.stop();capture.current=null;
  const call=id.current;if(!paused){id.current=null;deadline.current=0;deadlineMono.current=0;}update({state:paused&&call?'paused':'idle',message,busy:false,...(!paused&&!limited?{result:null,previousAnswers:[],answerDiagnostics:undefined,questionQueue:undefined,answerNotice:undefined} : {}),warning:false,audioStats:undefined,controlsBusy:true,...(limited?limitReachedView(answerLimit.current):{})});
  try{if(call)await change({sessionId:call,state:paused?'paused':'stopped'});}catch{update({message:'Audio is off. Server cleanup could not be confirmed; temporary text will expire.'});}finally{ending.current=false;update({controlsBusy:false});if(nextStop.current){const notice=nextStop.current;nextStop.current=null;void finish(false,notice);}}
 }
 async function begin(message:RuntimeMessage){
  if(ending.current||['connecting','listening','limited'].includes(viewRef.current.state))throw Error('Cuelo is still finishing its previous action.');
  const resume=message.resume===true;if(resume&&(!id.current||viewRef.current.state!=='paused'))throw Error('This session ended. Start a new call.');
  if(!isAuthenticated||!access?.invited||!access.enabled)throw Error('Live calls require sign-in, invited access and enabled testing.');
  if(typeof message.nonce!=='string'||!/^[a-f0-9]{64}$/.test(message.nonce))throw Error('Meeting audio access is missing.');
  if(!resume&&!['generic','document'].includes(String(message.mode)))throw Error('Choose your answer mode.');
  const run=++epoch.current,controller=new AbortController();abort.current=controller;const cancelled=()=>run!==epoch.current||controller.signal.aborted;
  update({state:'connecting',...(!resume?{result:null,previousAnswers:[],questionQueue:undefined,answerNotice:undefined,answerDiagnostics:diagnosticsEnabled?emptyDiagnostics():undefined} : {}),busy:false,message:'Connecting meeting audio and speech recognition…',...(!resume?{mode:message.mode as 'generic'|'document',sourceTitle:typeof message.sourceTitle==='string'?message.sourceTitle:null}:{})});
  try{
   const guarded=await preparePageAudio({browser:runtime,nonce:message.nonce,signal:controller.signal,onFailure:notice=>{if(!ending.current)void finish(false,notice);}});if(cancelled()){guarded.stop();return;}capture.current=guarded;
   if(resume)await change({sessionId:id.current!,state:'active'});
   else {const admitted=await start({mode:message.mode as 'generic'|'document',...(message.mode==='document'?{sourceId:message.sourceId as Id<'sources'>,...(typeof message.guestSecret==='string'?{guestSecret:message.guestSecret}:{})}:{})});if(cancelled()){await change({sessionId:admitted.sessionId,state:'stopped'});return;}answerLimit.current=admitted.answerLimit;completedAnswers.current=0;id.current=admitted.sessionId;deadline.current=admitted.deadline;deadlineMono.current=performance.now()+Math.max(0,admitted.deadline-Date.now());if(admitted.budgetAlert)update({message:'The testing budget is nearly used up.'});}
   if(cancelled())return;const call=id.current!;
   const grant=await credential({sessionId:call});if(cancelled())return;if(!grant.token)throw Error(grant.message);generation.current=grant.generation;
   if(!resume)queue.current=new QuestionQueue({
    detect:async utteranceId=>{const current=epoch.current,sessionId=id.current!;diagnostic('Checking a completed customer segment');const detected=await actions.current.detect({sessionId,utteranceId,generation:generation.current});if(current===epoch.current&&sessionId===id.current)diagnostic(detected.status==='question'?'Customer question recognised':detected.status==='skipped'?'Conversation added as context; no question':'Question check suspended');return detected;},
    answer:async utteranceId=>{const current=epoch.current,sessionId=id.current!,request=(viewRef.current.answerDiagnostics?.requests??0)+1;diagnostic(`Request ${request} sent`,'requests');const response=await actions.current.answer({sessionId,utteranceId,generation:generation.current});if(current===epoch.current&&sessionId===id.current)diagnostic(`Request ${request} returned: ${response.status}`,'responses');if(response.status==='error'&&response.problemCode!=='answer_check_failed')throw Error(response.message);if(response.status==='cancelled')throw Error('The pending answer could not finish because the call became unavailable.');return response;},
    display:response=>{completedAnswers.current++;const reached=answerLimitReached(completedAnswers.current,answerLimit.current);if(response.problemCode==='answer_check_failed'){diagnostic('Answer rejected safely; listening continues');update({answerNotice:{question:response.question,message:response.message}});if(reached)void finish(false,undefined,true);return;}diagnostic('Answer displayed','displayed');update({...showAnswer(viewRef.current,response)});if(reached)void finish(false,undefined,true);},
    failure:error=>{void finish(false,explain(error));},
    changed:state=>{if(ending.current||viewRef.current.state==='limited')return;update({questionQueue:state,busy:state.answering,message:state.answering?'Finding the answer. Listening continues.':state.checking?'Checking customer speech. Listening continues.':'Listening for customer questions.'});},
   });
   const live=await connectLiveSpeech({capture:{},customerFrames:guarded.frames('customer'),microphoneFrames:guarded.frames('salesperson'),token:grant.token,signal:controller.signal,
    onFailure:notice=>{void finish(false,notice);},onCustomerSpeech:()=>{if(cancelled())return;diagnostic('Customer speech detected; earlier questions retained','speechStarts');},
    onTurn:async(speaker,text)=>{if(cancelled()||id.current!==call)return;const stored=await append({sessionId:call,generation:generation.current,speaker,text});if(cancelled()||id.current!==call)return;if(speaker==='customer')queue.current?.add(stored.utteranceId);}
   });
   if(cancelled()){live.stop();return;}speech.current=live;await guarded.stream(deadline.current);if(cancelled()){live.stop();return;}update({state:'listening',message:'Listening for customer questions. Your microphone adds context only.'});queue.current?.resume();
  }catch(error){if(!cancelled())await finish(false,explain(error));throw error;}
 }
 const handlers=useRef<(m:RuntimeMessage)=>Promise<unknown>>(async()=>({}));handlers.current=async m=>{
  if(m.type==='status')return {ready:!isLoading&&isAuthenticated&&!!access,view:viewRef.current};
  if(m.type==='stop'){await finish(false,typeof m.message==='string'?m.message:undefined);return {view:viewRef.current};}
  if(m.type==='pause'){if(viewRef.current.state==='limited')return {view:viewRef.current};await finish(true);return {view:viewRef.current};}
  if(m.type==='start'){await begin(m);return {view:viewRef.current};}throw Error('Unknown call action.');
 };
 useEffect(()=>{const listener=(message:RuntimeMessage,sender:{id?:string},reply:(value:unknown)=>void)=>{if(message.to!=='call'||message.type==='audio-frame'||sender.id!==runtime.id)return;void handlers.current(message).then(reply).catch(error=>reply({error:explain(error)}));return true;};runtime.onMessage.addListener(listener);return()=>{runtime.onMessage.removeListener(listener);void finish();};},[]);
 useEffect(()=>{let pending=false;const timer=setInterval(()=>{const call=id.current;if(!call)return;if(Date.now()>=deadline.current||performance.now()>=deadlineMono.current){void finish(false,'The 60-minute limit was reached. Meet can continue.');return;}update({audioStats:capture.current?.stats(),warning:Date.now()>=deadline.current-300000||performance.now()>=deadlineMono.current-300000});void runtime.sendMessage({type:'call-alive'}).then(report=>{if(id.current===call&&capture.current&&report.audio)update({audioStats:{...capture.current.stats(),...report.audio}});}).catch(()=>{void finish(false,'Meeting connection lost. Cuelo stopped.');});if(pending||viewRef.current.state==='paused')return;pending=true;void heartbeat({sessionId:call}).catch(error=>{if(id.current===call)void finish(false,explain(error));}).finally(()=>{pending=false;});},5000);return()=>clearInterval(timer);},[heartbeat]);
 useEffect(()=>{if(isLoading||isAuthenticated)return;if(id.current||abort.current)void finish(false,'You signed out. Cuelo stopped.');},[isLoading,isAuthenticated]);
 return null;
}
