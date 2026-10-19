import {BUDGET_EXHAUSTED} from './answerErrors';
import {MAX_CALL_SOURCES,MAX_COMBINED_SOURCE_CHARACTERS,validateSourceSelection} from './sourceSelectionPolicy';
import {recordEndedCall} from './dashboard';
import {liveAnswerResult} from './liveAnswerValues';
import {v,ConvexError} from 'convex/values';
import {getAuthUserId} from '@convex-dev/auth/server';
import {mutation,query,internalMutation,internalQuery} from './_generated/server';
import type {QueryCtx,MutationCtx} from './_generated/server';
import type {Id,Doc} from './_generated/dataModel';
import {ownerKey} from './sources';
import {allocationLimit,budgetDecision,spendingMonth,callAnswerPoolPaise} from './spendingPolicy';
import {liveCallConfig,checkCallText,CALL_DURATION_MS} from './liveCallPolicy';
import {accountTrial,trialRecord,settleTrial,allowedTrialCalls,FREE_CALLS,FREE_LISTENING_MS,TRIAL_ENDED,trialValue} from './freeTrial';
import {sourceMetaValue,livePassageValue} from './sourceValues';
const mode=v.union(v.literal('generic'),v.literal('document'));
const sessionArg={sessionId:v.id('liveCalls')};
async function signedIn(ctx:QueryCtx){const user=await getAuthUserId(ctx);if(!user)throw new ConvexError('Sign in with Google before starting a call.');return user;}
export async function ownedCall(ctx:QueryCtx,id:Id<'liveCalls'>,active=true){const user=await getAuthUserId(ctx);const row=await ctx.db.get(id);if(!user||!row||row.userId!==user)throw new ConvexError('This call is unavailable.');if(active&&(row.state!=='active'||row.deadline<=Date.now()||row.expiresAt<=Date.now()))throw new ConvexError('This Cuelo session stopped or expired.');return row;}
async function checkCallSources(ctx:QueryCtx,row:Doc<'liveCalls'>){for(const sourceId of row.sourceIds?.length?row.sourceIds:(row.sourceId?[row.sourceId]:[])){const source=await ctx.db.get(sourceId);if(!source||source.ownerKey!==row.sourceOwnerKey||source.expiresAt!==null&&source.expiresAt<=Date.now())throw new ConvexError('Your source changed or expired. Stop Cuelo and select it again.');}}
async function removeText(ctx:MutationCtx,row:Doc<'liveCalls'>){await settleTrial(ctx,row);const settled=await ctx.db.get(row._id);if(settled)await recordEndedCall(ctx,settled);const trial=await trialRecord(ctx,row.userId);if(trial?.sessionId===row._id)await ctx.db.patch(trial._id,{sessionId:null});for(const entry of await ctx.db.query('callText').withIndex('by_session',q=>q.eq('sessionId',row._id)).take(8000))await ctx.db.delete(entry._id);for(const link of await ctx.db.query('liveCallSources').withIndex('by_session',q=>q.eq('sessionId',row._id)).take(MAX_CALL_SOURCES))await ctx.db.delete(link._id);await ctx.db.delete(row._id);if(row.sourceId){const source=await ctx.db.get(row.sourceId);if(source&&!source.saved&&source.ownerKey===row.sourceOwnerKey){for(const p of await ctx.db.query('sourcePassages').withIndex('by_source',q=>q.eq('sourceId',source._id)).take(501))await ctx.db.delete(p._id);await ctx.db.delete(source._id);}}}
export const availability=query({args:{},returns:v.object({enabled:v.boolean(),signedIn:v.boolean(),trial:v.union(trialValue,v.null())}),handler:async ctx=>{const user=await getAuthUserId(ctx);return {enabled:!!liveCallConfig(),signedIn:!!user,trial:user?await accountTrial(ctx,user):null};}});
export const start=mutation({args:{mode,sourceId:v.optional(v.id('sources')),sourceIds:v.optional(v.array(v.id('sources'))),guestSecret:v.optional(v.string())},returns:v.object({sessionId:v.id('liveCalls'),deadline:v.number(),hardDeadline:v.number(),budgetAlert:v.boolean(),answerLimit:v.number(),idlePauseEnabled:v.optional(v.boolean())}),handler:async(ctx,args)=>{
 const user=await signedIn(ctx);const config=liveCallConfig();if(!config)throw new ConvexError('Live listening testing is not enabled yet. No paid connection was started.');
 const now=Date.now();const previous=await trialRecord(ctx,user);if(previous?.sessionId){const old=await ctx.db.get(previous.sessionId);if(old&&old.userId===user){if(old.expiresAt>now&&old.deadline>now)throw new ConvexError('A call is already active for your account. Pause, resume or stop that call first.');await removeText(ctx,old);}}const trial=await accountTrial(ctx,user,now);if(trial.exhausted)throw new ConvexError(TRIAL_ENDED);for(const state of ['active','paused'] as const){const calls=await ctx.db.query('liveCalls').withIndex('by_state',q=>q.eq('state',state)).take(10);if(calls.some(c=>c.expiresAt>now&&c.deadline>now))throw new ConvexError('Another call is active. Try again when it finishes.');}
 let sourceOwnerKey:string|null=null;let source:Doc<'sources'>|null=null;let selectedIds:Id<'sources'>[]=[];
 if(args.mode==='document'){
  if(args.sourceId&&args.sourceIds)throw new ConvexError('Choose one source selection.');
  selectedIds=args.sourceIds??(args.sourceId?[args.sourceId]:[]);try{validateSourceSelection(selectedIds);}catch(error){throw new ConvexError((error as Error).message);}
  sourceOwnerKey=await ownerKey(ctx,args.guestSecret);
  let combinedCharacters=0;
  for(const id of selectedIds){const candidate=await ctx.db.get(id);if(!candidate||candidate.ownerKey!==sourceOwnerKey||candidate.expiresAt!==null&&candidate.expiresAt<=now||args.sourceIds&&!candidate.saved)throw new ConvexError('Your selected source changed or expired. Confirm it again.');if(!source)source=candidate;if(selectedIds.length>1){const passages=await ctx.db.query('sourcePassages').withIndex('by_source',q=>q.eq('sourceId',id)).take(501);combinedCharacters+=passages.reduce((total,p)=>total+p.text.length,0);if(combinedCharacters>MAX_COMBINED_SOURCE_CHARACTERS)throw new ConvexError('Your selected sources contain too much text for one call. Select fewer or smaller sources; nothing was cut off.');}}
 }else if(args.sourceId||args.sourceIds||args.guestSecret)throw new ConvexError('Generic answers must not include a document.');
 const used=(await ctx.db.query('liveCallUsage').withIndex('by_scope',q=>q.eq('scope','pilot')).take(1))[0];if((used?.sessions??0)>=config.sessions)throw new ConvexError('The live-call testing allowance is used up.');
 const answerPoolPaise=callAnswerPoolPaise(config.answers),callReservePaise=config.reservePaise+answerPoolPaise;
 const month=spendingMonth(now);const ledger=(await ctx.db.query('spendingMonths').withIndex('by_month',q=>q.eq('month',month)).take(1))[0];const decision=budgetDecision(ledger?.reservedPaise??0,callReservePaise,allocationLimit());if(!decision.allowed)throw new ConvexError(BUDGET_EXHAUSTED);
 const idlePauseEnabled=process.env.CUELO_IDLE_PAUSE_ENABLED==='true';
 const hardDeadline=now+CALL_DURATION_MS,deadline=Math.min(hardDeadline,now+trial.remainingMs);const id=await ctx.db.insert('liveCalls',{userId:user,mode:args.mode,sourceId:source?source._id:null,sourceIds:selectedIds,sourceOwnerKey,state:'active',deadline,expiresAt:now+120000,heartbeatAt:now,generation:0,connections:0,sequence:0,customerRevision:0,characters:0,detections:0,answers:0,maxConnections:config.connections,maxDetections:config.detections,maxAnswers:config.answers,analyticsEnabled:true,listeningMs:0,completedAnswers:0,idlePauseEnabled,trialIncludesPaused:idlePauseEnabled,trialClockAt:null,trialEnforced:true,trialCounted:false,trialSegmentAt:null,hardDeadline,trialTimeLimit:deadline<hardDeadline});
 if(answerPoolPaise)await ctx.db.insert('callAnswerBudgets',{sessionId:id,month,allocatedPaise:answerPoolPaise,remainingPaise:answerPoolPaise});
 const trialRow=await trialRecord(ctx,user);if(trialRow)await ctx.db.patch(trialRow._id,{sessionId:id});else await ctx.db.insert('freeCallTrials',{userId:user,callsUsed:0,listeningMs:0,sessionId:id});
 const values={reservedPaise:(ledger?.reservedPaise??0)+callReservePaise,reservations:(ledger?.reservations??0)+1};if(ledger)await ctx.db.patch(ledger._id,values);else await ctx.db.insert('spendingMonths',{month,...values});await ctx.db.insert('spendingReservations',{key:`live-${id}`,month,purpose:'live',amountPaise:callReservePaise});if(used)await ctx.db.patch(used._id,{sessions:used.sessions+1});else await ctx.db.insert('liveCallUsage',{scope:'pilot',sessions:1});
 for(const sourceId of selectedIds)await ctx.db.insert('liveCallSources',{sessionId:id,sourceId});
 if(source&&!source.saved)await ctx.db.patch(source._id,{expiresAt:hardDeadline});
 return {sessionId:id,deadline,hardDeadline,budgetAlert:decision.alert,answerLimit:config.answers,idlePauseEnabled};
}});
const view=v.object({state:v.union(v.literal('active'),v.literal('paused')),deadline:v.number(),mode,sourceId:v.union(v.id('sources'),v.null()),generation:v.number(),customerRevision:v.number()});
export const get=query({args:sessionArg,returns:v.union(view,v.null()),handler:async(ctx,args)=>{try{const row=await ownedCall(ctx,args.sessionId,false);if(row.deadline<=Date.now()||row.expiresAt<=Date.now())return null;return {state:row.state,deadline:row.deadline,mode:row.mode,sourceId:row.sourceId,generation:row.generation,customerRevision:row.customerRevision};}catch{return null;}}});
export const heartbeat=mutation({args:sessionArg,returns:v.null(),handler:async(ctx,args)=>{const row=await ownedCall(ctx,args.sessionId,false);if(row.state==='paused'&&!row.trialIncludesPaused)return null;if(row.trialIncludesPaused&&(await accountTrial(ctx,row.userId)).remainingMs<=0)throw new ConvexError(TRIAL_ENDED);if(row.deadline<=Date.now()||row.expiresAt<=Date.now())throw new ConvexError('This Cuelo session stopped or expired.');await signedIn(ctx);if(!liveCallConfig())throw new ConvexError('Live testing was switched off. Stop Cuelo.');await checkCallSources(ctx,row);await ctx.db.patch(row._id,{heartbeatAt:Date.now(),expiresAt:Math.min(row.deadline,Date.now()+120000)});return null;}});
export const change=mutation({args:{...sessionArg,state:v.union(v.literal('paused'),v.literal('active'),v.literal('stopped'))},returns:v.union(v.null(),v.object({generation:v.number(),deadline:v.number(),trialTimeLimit:v.boolean()})),handler:async(ctx,args)=>{
 // Credential failure or expiry cleanup may already have removed this call.
 // A signed-in repeat Stop has nothing left to delete; existing rows still
 // pass the same ownership check below, and real deletion errors propagate.
 if(args.state==='stopped'){
  if(!await getAuthUserId(ctx))throw new ConvexError('This call is unavailable.');
  if(!await ctx.db.get(args.sessionId))return null;
 }
 const row=await ownedCall(ctx,args.sessionId,false);if(args.state==='stopped'){await removeText(ctx,row);if(row.sourceId){const source=await ctx.db.get(row.sourceId);if(source&&!source.saved&&source.ownerKey===row.sourceOwnerKey){for(const p of await ctx.db.query('sourcePassages').withIndex('by_source',q=>q.eq('sourceId',source._id)).take(501))await ctx.db.delete(p._id);await ctx.db.delete(source._id);}}return null;}
 if(row.trialIncludesPaused&&(await accountTrial(ctx,row.userId)).remainingMs<=0)throw new ConvexError(TRIAL_ENDED);
 if(row.deadline<=Date.now()||row.expiresAt<=Date.now())throw new ConvexError('This call expired. Start a new session.');if(args.state==='active'){await signedIn(ctx);await checkCallSources(ctx,row);const trial=await accountTrial(ctx,row.userId);if(trial.remainingMs<=0)throw new ConvexError(TRIAL_ENDED);if(!liveCallConfig())throw new ConvexError('Live listening testing is not enabled yet.');}
 await settleTrial(ctx,row);const remaining=await accountTrial(ctx,row.userId);const nextDeadline=args.state==='active'||row.trialIncludesPaused?Math.min(row.hardDeadline??row.deadline,Date.now()+remaining.remainingMs):row.hardDeadline??row.deadline;
 await ctx.db.patch(row._id,{deadline:nextDeadline,trialTimeLimit:nextDeadline<(row.hardDeadline??row.deadline),state:args.state,generation:row.generation+1,customerRevision:row.customerRevision+1,expiresAt:args.state==='paused'&&!row.trialIncludesPaused?(row.hardDeadline??row.deadline):Math.min(nextDeadline,Date.now()+120000),...(row.trialIncludesPaused&&row.trialCounted?{trialClockAt:Date.now()}: {})});return args.state==='active'?{generation:row.generation+1,deadline:nextDeadline,trialTimeLimit:nextDeadline<(row.hardDeadline??row.deadline)}:null;
}});
export const listeningReady=mutation({args:sessionArg,returns:v.object({deadline:v.number(),trialTimeLimit:v.boolean()}),handler:async(ctx,args)=>{
 const row=await ownedCall(ctx,args.sessionId);if(!liveCallConfig())throw new ConvexError('Live listening is unavailable right now.');
 if(row.connections<1)throw new ConvexError('Speech recognition must connect before listening starts.');
 if(!row.trialEnforced)return {deadline:row.deadline,trialTimeLimit:false};
 const record=await trialRecord(ctx,row.userId);if(!record||record.sessionId!==row._id)throw new ConvexError('This call is unavailable.');
 if(row.trialSegmentAt!=null)return {deadline:row.deadline,trialTimeLimit:!!row.trialTimeLimit};
 if((!row.trialCounted&&record.callsUsed>=allowedTrialCalls(record))||(record.trialTimeMs??record.listeningMs)>=FREE_LISTENING_MS)throw new ConvexError(TRIAL_ENDED);
 const now=Date.now(),hard=row.hardDeadline??row.deadline,deadline=Math.min(hard,now+(await accountTrial(ctx,row.userId,now)).remainingMs);
 await ctx.db.patch(record._id,{callsUsed:record.callsUsed+(row.trialCounted?0:1)});
 await ctx.db.patch(row._id,{trialCounted:true,trialSegmentAt:now,...(row.trialIncludesPaused&&row.trialClockAt==null?{trialClockAt:now}:{}),connectionAttempts:0,connectionRetryAt:row.connectionRetryAt??0,deadline,trialTimeLimit:deadline<hard,expiresAt:Math.min(deadline,now+120000)});
 return {deadline,trialTimeLimit:deadline<hard};
}});
export const invalidate=mutation({args:sessionArg,returns:v.null(),handler:async(ctx,args)=>{const row=await ownedCall(ctx,args.sessionId);await ctx.db.patch(row._id,{customerRevision:row.customerRevision+1});return null;}});
export const connectionFailed=internalMutation({args:sessionArg,returns:v.null(),handler:async(ctx,args)=>{
 const existing=await ctx.db.get(args.sessionId);if(!existing)return null;
 const row=await ownedCall(ctx,args.sessionId,false);
 if(!row.trialCounted||row.deadline<=Date.now()||row.expiresAt<=Date.now()){await removeText(ctx,row);return null;}
 await settleTrial(ctx,row);const hard=row.hardDeadline??row.deadline;
 await ctx.db.patch(row._id,{state:'paused',deadline:hard,expiresAt:hard,generation:row.generation+1,customerRevision:row.customerRevision+1,trialTimeLimit:row.trialIncludesPaused?!!row.trialTimeLimit:false,...(row.trialIncludesPaused?{trialClockAt:Date.now(),deadline:row.deadline,expiresAt:Math.min(row.deadline,Date.now()+120000)}:{})});
 return null;
}});
const turnArgs={...sessionArg,generation:v.number(),speaker:v.union(v.literal('customer'),v.literal('salesperson')),text:v.string()};
const turnResult=v.object({utteranceId:v.id('callText'),revision:v.number()});
async function appendTurn(ctx:MutationCtx,args:{sessionId:Id<'liveCalls'>;generation:number;speaker:'customer'|'salesperson';text:string},typed=false){
 const row=await ownedCall(ctx,args.sessionId);await signedIn(ctx);
 if(args.generation!==row.generation)throw new ConvexError('Old audio cannot be added after pausing or reconnecting.');
 if(row.trialEnforced&&row.trialSegmentAt==null)throw new ConvexError('Start listening before sending a question.');
 if(typed){if(!row.trialCounted||row.trialSegmentAt==null||row.connections<1)throw new ConvexError('Start listening before sending a question.');if(row.detections>=row.maxDetections)throw new ConvexError('This session reached its question allowance. Stop Cuelo.');if(!liveCallConfig())throw new ConvexError('Live listening is unavailable right now.');if(!args.text.trim()||args.text.trim().length>1000)throw new ConvexError('Type a question using 1 to 1,000 characters.');if(row.maxAnswers>0&&row.answers>=row.maxAnswers)throw new ConvexError('The live answer testing allowance is used up. Stop Cuelo.');}
 let text:string;try{text=checkCallText(args.text,row.characters,row.sequence);}catch(error){throw new ConvexError(error instanceof Error?error.message:'Call text is too large.');}
 const sequence=row.sequence+1,revision=row.customerRevision+(args.speaker==='customer'?1:0);
 const utteranceId=await ctx.db.insert('callText',{sessionId:row._id,sequence,speaker:args.speaker,text,revision,processed:false,...(typed?{question:text,questionStatus:'question' as const}: {})});
 await ctx.db.patch(row._id,{sequence,customerRevision:revision,characters:row.characters+text.length,...(typed?{detections:row.detections+1}:{})});return {utteranceId,revision};
}
export const append=mutation({args:turnArgs,returns:turnResult,handler:async(ctx,args)=>appendTurn(ctx,args)});
// Explicitly typed questions use the same temporary call context and answer queue,
// without paying a model to decide whether the user asked a question.
export const typeQuestion=mutation({args:{...sessionArg,generation:v.number(),text:v.string()},returns:turnResult,handler:async(ctx,args)=>appendTurn(ctx,{...args,speaker:'customer'},true)});
export const credentialAdmission=internalMutation({args:sessionArg,returns:v.object({generation:v.number(),deadline:v.number()}),handler:async(ctx,args)=>{const row=await ownedCall(ctx,args.sessionId);await signedIn(ctx);if(!liveCallConfig())throw new ConvexError('Live speech testing is not enabled yet.');if(!row.idlePauseEnabled&&row.connections>=row.maxConnections)throw new ConvexError('This session reached its connection testing allowance. Stop Cuelo.');if(row.idlePauseEnabled&&(row.connectionRetryAt??0)>Date.now())throw new ConvexError('Speech recognition could not reconnect yet. Wait a moment and try Resume.');await ctx.db.patch(row._id,{...(row.idlePauseEnabled?{connectionAttempts:(row.connectionAttempts??0)+1,connectionRetryAt:Date.now()+Math.min(30000,1000*2**Math.min(row.connectionAttempts??0,5))}:{}),connections:row.connections+1,generation:row.generation+1,customerRevision:row.customerRevision+1});return {generation:row.generation+1,deadline:row.deadline};}});
export const prepare=internalMutation({args:{...sessionArg,utteranceId:v.id('callText')},returns:v.union(v.object({revision:v.number(),question:v.string(),mode}),v.null()),handler:async(ctx,args)=>{const row=await ownedCall(ctx,args.sessionId);await signedIn(ctx);if(!liveCallConfig())throw new ConvexError('Live answer testing is not enabled yet.');const text=await ctx.db.get(args.utteranceId);if(!text||text.sessionId!==row._id||text.speaker!=='customer'||text.processed||text.revision!==row.customerRevision)return null;if(row.detections>=row.maxDetections)throw new ConvexError('The question-detection testing allowance is used up. Stop Cuelo.');await ctx.db.patch(text._id,{processed:true});await ctx.db.patch(row._id,{detections:row.detections+1});return {revision:text.revision,question:text.text,mode:row.mode};}});
export const check=internalQuery({args:{...sessionArg,revision:v.optional(v.number()),generation:v.optional(v.number())},returns:v.boolean(),handler:async(ctx,args)=>{try{const row=await ownedCall(ctx,args.sessionId);await signedIn(ctx);return !!liveCallConfig()&&(args.revision===undefined||row.customerRevision===args.revision)&&(args.generation===undefined||row.generation===args.generation);}catch{return false;}}});
export const reserveAnswer=internalMutation({args:{...sessionArg,revision:v.number()},returns:v.null(),handler:async(ctx,args)=>{const row=await ownedCall(ctx,args.sessionId);await signedIn(ctx);if(!liveCallConfig())throw new ConvexError('Live answer testing is not enabled yet.');if(row.customerRevision!==args.revision)throw new ConvexError('This answer was cancelled.');if(row.maxAnswers>0&&row.answers>=row.maxAnswers)throw new ConvexError('The live answer testing allowance is used up. Stop Cuelo.');await ctx.db.patch(row._id,{answers:row.answers+1});return null;}});
export const context=internalQuery({args:{...sessionArg,question:v.string(),throughSequence:v.optional(v.number()),includeEvidence:v.optional(v.boolean())},returns:v.object({conversation:v.array(v.object({speaker:v.union(v.literal('customer'),v.literal('salesperson')),text:v.string()})),source:v.union(sourceMetaValue,v.null()),sources:v.array(sourceMetaValue),passages:v.array(livePassageValue)}),handler:async(ctx,args)=>{
 const row=await ownedCall(ctx,args.sessionId);const latest=await ctx.db.query('callText').withIndex('by_session',q=>args.throughSequence===undefined?q.eq('sessionId',row._id):q.eq('sessionId',row._id).lte('sequence',args.throughSequence)).order('desc').take(12);
 const terms=(args.question.toLowerCase().match(/[a-z0-9]{4,}/g)??[]).slice(0,5).join(' ');const related=terms?await ctx.db.query('callText').withSearchIndex('search_text',q=>q.search('text',terms).eq('sessionId',row._id)).take(12):[];
 const rows=[...new Map([...related,...latest].filter(r=>args.throughSequence===undefined||r.sequence<=args.throughSequence).map(r=>[r._id,r])).values()].sort((a,b)=>a.sequence-b.sequence);
 let source:null|import('convex/values').Infer<typeof sourceMetaValue>=null;const sources:Array<import('convex/values').Infer<typeof sourceMetaValue>>=[];let passages:Array<import('./sourceValues').SourcePassage>=[];
 const ids=row.sourceIds?.length?row.sourceIds:(row.sourceId?[row.sourceId]:[]);
 for(let index=0;index<ids.length;index++){
  const s=await ctx.db.get(ids[index]);if(!s||s.ownerKey!==row.sourceOwnerKey||s.expiresAt!==null&&s.expiresAt<=Date.now())throw new ConvexError('Your source changed or expired. Stop and confirm it again.');
  const meta={id:s._id,title:s.title,kind:s.kind,url:s.url,pageCount:s.pageCount,passageCount:s.passageCount,saved:s.saved,expiresAt:s.expiresAt};sources.push(meta);if(!source)source=meta;
  if(args.includeEvidence===false)continue;
  const rows=await ctx.db.query('sourcePassages').withIndex('by_source',q=>q.eq('sourceId',s._id)).take(501);
  passages.push(...rows.map(p=>({ordinal:index*1000+p.ordinal,reference:p.reference,text:p.text,...(ids.length>1?{sourceId:s._id,sourceTitle:s.title}:{})})));
 }
 return {conversation:rows.map(r=>({speaker:r.speaker,text:r.text})),source,sources,passages};
}});
export const cleanup=internalMutation({args:{},returns:v.null(),handler:async ctx=>{const rows=await ctx.db.query('liveCalls').withIndex('by_expiry',q=>q.lte('expiresAt',Date.now())).take(1);for(const row of rows)await removeText(ctx,row);return null;}});

// Sidebar questions are independent of subsequent speech; generation changes
// only when capture is paused/resumed, never when another turn arrives.
const queuedArg={...sessionArg,utteranceId:v.id('callText'),generation:v.number()};
export const queuedPrepare=internalMutation({args:{...queuedArg,phase:v.union(v.literal('detect'),v.literal('answer'))},returns:v.union(v.object({mode,question:v.string(),sequence:v.number(),cached:v.boolean(),skipped:v.boolean(),answerResult:v.union(liveAnswerResult,v.null())}),v.null()),handler:async(ctx,args)=>{
 const row=await ownedCall(ctx,args.sessionId);await signedIn(ctx);if(!liveCallConfig()||row.generation!==args.generation)return null;
 const text=await ctx.db.get(args.utteranceId);if(!text||text.sessionId!==row._id||text.speaker!=='customer')return null;
 const base={mode:row.mode,question:text.question??text.text,sequence:text.sequence,cached:false,skipped:false,answerResult:text.answerResult??null};
 if(args.phase==='detect'){
  if(text.questionStatus)return {...base,cached:true,skipped:text.questionStatus==='skipped'};
  if(text.detectionGeneration===args.generation)throw new ConvexError('This speech segment is already being checked.');
  if(row.detections>=row.maxDetections)throw new ConvexError('The question-detection testing allowance is used up. Stop Cuelo.');
  await ctx.db.patch(text._id,{detectionGeneration:args.generation});await ctx.db.patch(row._id,{detections:row.detections+1});return base;
 }
 if(text.questionStatus==='answered'&&text.answerResult)return {...base,cached:true};
 if(text.questionStatus!=='question'||!text.question)return null;
 if(text.answerGeneration===args.generation)throw new ConvexError('This question is already being answered.');
 if(!text.answerReserved){if(row.maxAnswers>0&&row.answers>=row.maxAnswers)throw new ConvexError('The live answer testing allowance is used up. Stop Cuelo.');await ctx.db.patch(row._id,{answers:row.answers+1});}
 await ctx.db.patch(text._id,{answerGeneration:args.generation,answerReserved:true});return base;
}});
export const queuedComplete=internalMutation({args:{...queuedArg,question:v.optional(v.string()),skipped:v.optional(v.boolean()),answered:v.optional(v.boolean()),answerResult:v.optional(liveAnswerResult)},returns:v.boolean(),handler:async(ctx,args)=>{
 const row=await ownedCall(ctx,args.sessionId);await signedIn(ctx);if(!liveCallConfig()||row.generation!==args.generation)return false;
 const text=await ctx.db.get(args.utteranceId);if(!text||text.sessionId!==row._id||text.speaker!=='customer')return false;
 if(args.answered){if(text.questionStatus!=='question'||text.answerGeneration!==args.generation)return false;if(!args.answerResult)throw new ConvexError('The completed answer is unavailable.');await ctx.db.patch(text._id,{questionStatus:'answered',processed:true,answerResult:args.answerResult});if(!args.answerResult.problemCode&&args.answerResult.status!=='error'&&args.answerResult.status!=='cancelled')await ctx.db.patch(row._id,{completedAnswers:(row.completedAnswers??0)+1});}
 else {if(text.detectionGeneration!==args.generation||text.questionStatus)return false;const question=args.question?.trim();if(!args.skipped&&(!question||question.length>1000))throw new ConvexError('The customer question could not be understood safely.');await ctx.db.patch(text._id,{questionStatus:args.skipped?'skipped':'question',...(question?{question}:{}),processed:!!args.skipped});}
 return true;
}});
