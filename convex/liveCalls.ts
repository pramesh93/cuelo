import {liveAnswerResult} from './liveAnswerValues';
import {v,ConvexError} from 'convex/values';
import {getAuthUserId} from '@convex-dev/auth/server';
import {mutation,query,internalMutation,internalQuery} from './_generated/server';
import type {QueryCtx,MutationCtx} from './_generated/server';
import type {Id,Doc} from './_generated/dataModel';
import {ownerKey} from './sources';
import {budgetDecision,spendingMonth} from './spendingPolicy';
import {liveCallConfig,checkCallText,CALL_DURATION_MS} from './liveCallPolicy';
import {sourceMetaValue,passageValue} from './sourceValues';
const mode=v.union(v.literal('generic'),v.literal('document'));
const sessionArg={sessionId:v.id('liveCalls')};
async function invited(ctx:QueryCtx){const user=await getAuthUserId(ctx);if(!user)throw new ConvexError('Sign in with Google before starting a call.');const row=(await ctx.db.query('testerAccess').withIndex('by_user',q=>q.eq('userId',user)).take(1))[0];if(!row?.enabled)throw new ConvexError('Live calls are available to invited testers only.');return user;}
export async function ownedCall(ctx:QueryCtx,id:Id<'liveCalls'>,active=true){const user=await getAuthUserId(ctx);const row=await ctx.db.get(id);if(!user||!row||row.userId!==user)throw new ConvexError('This call is unavailable.');if(active&&(row.state!=='active'||row.deadline<=Date.now()||row.expiresAt<=Date.now()))throw new ConvexError('This Cuelo session stopped or expired.');return row;}
async function removeText(ctx:MutationCtx,row:Doc<'liveCalls'>){for(const entry of await ctx.db.query('callText').withIndex('by_session',q=>q.eq('sessionId',row._id)).take(8000))await ctx.db.delete(entry._id);await ctx.db.delete(row._id);if(row.sourceId){const source=await ctx.db.get(row.sourceId);if(source&&!source.saved&&source.ownerKey===row.sourceOwnerKey){for(const p of await ctx.db.query('sourcePassages').withIndex('by_source',q=>q.eq('sourceId',source._id)).take(501))await ctx.db.delete(p._id);await ctx.db.delete(source._id);}}}
export const availability=query({args:{},returns:v.object({enabled:v.boolean(),signedIn:v.boolean(),invited:v.boolean()}),handler:async ctx=>{const signedIn=!!await getAuthUserId(ctx);let allowed=false;try{await invited(ctx);allowed=true;}catch{}return {enabled:!!liveCallConfig(),signedIn,invited:allowed};}});
export const start=mutation({args:{mode,sourceId:v.optional(v.id('sources')),guestSecret:v.optional(v.string())},returns:v.object({sessionId:v.id('liveCalls'),deadline:v.number(),budgetAlert:v.boolean(),answerLimit:v.number()}),handler:async(ctx,args)=>{
 const user=await invited(ctx);const config=liveCallConfig();if(!config)throw new ConvexError('Live listening testing is not enabled yet. No paid connection was started.');
 const now=Date.now();for(const state of ['active','paused'] as const){const calls=await ctx.db.query('liveCalls').withIndex('by_state',q=>q.eq('state',state)).take(10);if(calls.some(c=>c.expiresAt>now&&c.deadline>now))throw new ConvexError('Another tester session is active. Stop it before starting a new call.');}
 let sourceOwnerKey:string|null=null;let source:Doc<'sources'>|null=null;
 if(args.mode==='document'){if(!args.sourceId)throw new ConvexError('Confirm one source before listening.');sourceOwnerKey=await ownerKey(ctx,args.guestSecret);source=await ctx.db.get(args.sourceId);if(!source||source.ownerKey!==sourceOwnerKey||source.expiresAt!==null&&source.expiresAt<=now)throw new ConvexError('Your selected source changed or expired. Confirm it again.');}
 else if(args.sourceId||args.guestSecret)throw new ConvexError('Generic answers must not include a document.');
 const used=(await ctx.db.query('liveCallUsage').withIndex('by_scope',q=>q.eq('scope','pilot')).take(1))[0];if((used?.sessions??0)>=config.sessions)throw new ConvexError('The live-call testing allowance is used up.');
 const month=spendingMonth(now);const ledger=(await ctx.db.query('spendingMonths').withIndex('by_month',q=>q.eq('month',month)).take(1))[0];const decision=budgetDecision(ledger?.reservedPaise??0,config.reservePaise);if(!decision.allowed)throw new ConvexError('The testing budget is reached. New paid sessions have stopped.');
 const deadline=now+CALL_DURATION_MS;const id=await ctx.db.insert('liveCalls',{userId:user,mode:args.mode,sourceId:source?source._id:null,sourceOwnerKey,state:'active',deadline,expiresAt:now+120000,heartbeatAt:now,generation:0,connections:0,sequence:0,customerRevision:0,characters:0,detections:0,answers:0,maxConnections:config.connections,maxDetections:config.detections,maxAnswers:config.answers});
 const values={reservedPaise:(ledger?.reservedPaise??0)+config.reservePaise,reservations:(ledger?.reservations??0)+1};if(ledger)await ctx.db.patch(ledger._id,values);else await ctx.db.insert('spendingMonths',{month,...values});await ctx.db.insert('spendingReservations',{key:`live-${id}`,month,purpose:'live',amountPaise:config.reservePaise});if(used)await ctx.db.patch(used._id,{sessions:used.sessions+1});else await ctx.db.insert('liveCallUsage',{scope:'pilot',sessions:1});
 if(source&&!source.saved)await ctx.db.patch(source._id,{expiresAt:deadline});
 return {sessionId:id,deadline,budgetAlert:decision.alert,answerLimit:config.answers};
}});
const view=v.object({state:v.union(v.literal('active'),v.literal('paused')),deadline:v.number(),mode,sourceId:v.union(v.id('sources'),v.null()),generation:v.number(),customerRevision:v.number()});
export const get=query({args:sessionArg,returns:v.union(view,v.null()),handler:async(ctx,args)=>{try{const row=await ownedCall(ctx,args.sessionId,false);if(row.deadline<=Date.now()||row.expiresAt<=Date.now())return null;return {state:row.state,deadline:row.deadline,mode:row.mode,sourceId:row.sourceId,generation:row.generation,customerRevision:row.customerRevision};}catch{return null;}}});
export const heartbeat=mutation({args:sessionArg,returns:v.null(),handler:async(ctx,args)=>{const row=await ownedCall(ctx,args.sessionId);await invited(ctx);if(!liveCallConfig())throw new ConvexError('Live testing was switched off. Stop Cuelo.');if(row.sourceId){const source=await ctx.db.get(row.sourceId);if(!source||source.ownerKey!==row.sourceOwnerKey)throw new ConvexError('Your source changed. Stop Cuelo and confirm it again.');}await ctx.db.patch(row._id,{heartbeatAt:Date.now(),expiresAt:Math.min(row.deadline,Date.now()+120000)});return null;}});
export const change=mutation({args:{...sessionArg,state:v.union(v.literal('paused'),v.literal('active'),v.literal('stopped'))},returns:v.null(),handler:async(ctx,args)=>{
 const row=await ownedCall(ctx,args.sessionId,false);if(args.state==='stopped'){await removeText(ctx,row);if(row.sourceId){const source=await ctx.db.get(row.sourceId);if(source&&!source.saved&&source.ownerKey===row.sourceOwnerKey){for(const p of await ctx.db.query('sourcePassages').withIndex('by_source',q=>q.eq('sourceId',source._id)).take(501))await ctx.db.delete(p._id);await ctx.db.delete(source._id);}}return null;}
 if(row.deadline<=Date.now()||row.expiresAt<=Date.now())throw new ConvexError('This call expired. Start a new session.');if(args.state==='active'){await invited(ctx);if(!liveCallConfig())throw new ConvexError('Live listening testing is not enabled yet.');}
 await ctx.db.patch(row._id,{state:args.state,generation:row.generation+1,customerRevision:row.customerRevision+1,expiresAt:args.state==='paused'?row.deadline:Math.min(row.deadline,Date.now()+120000)});return null;
}});
export const invalidate=mutation({args:sessionArg,returns:v.null(),handler:async(ctx,args)=>{const row=await ownedCall(ctx,args.sessionId);await ctx.db.patch(row._id,{customerRevision:row.customerRevision+1});return null;}});
export const append=mutation({args:{...sessionArg,generation:v.number(),speaker:v.union(v.literal('customer'),v.literal('salesperson')),text:v.string()},returns:v.object({utteranceId:v.id('callText'),revision:v.number()}),handler:async(ctx,args)=>{
 const row=await ownedCall(ctx,args.sessionId);await invited(ctx);if(args.generation!==row.generation)throw new ConvexError('Old audio cannot be added after pausing or reconnecting.');let text:string;try{text=checkCallText(args.text,row.characters,row.sequence);}catch(error){throw new ConvexError(error instanceof Error?error.message:'Call text is too large.');}
 const sequence=row.sequence+1,revision=row.customerRevision+(args.speaker==='customer'?1:0);const utteranceId=await ctx.db.insert('callText',{sessionId:row._id,sequence,speaker:args.speaker,text,revision,processed:false});await ctx.db.patch(row._id,{sequence,customerRevision:revision,characters:row.characters+text.length});return {utteranceId,revision};
}});
export const credentialAdmission=internalMutation({args:sessionArg,returns:v.object({generation:v.number(),deadline:v.number()}),handler:async(ctx,args)=>{const row=await ownedCall(ctx,args.sessionId);await invited(ctx);if(!liveCallConfig())throw new ConvexError('Live speech testing is not enabled yet.');if(row.connections>=row.maxConnections)throw new ConvexError('This session reached its connection testing allowance. Stop Cuelo.');await ctx.db.patch(row._id,{connections:row.connections+1,generation:row.generation+1,customerRevision:row.customerRevision+1});return {generation:row.generation+1,deadline:row.deadline};}});
export const prepare=internalMutation({args:{...sessionArg,utteranceId:v.id('callText')},returns:v.union(v.object({revision:v.number(),question:v.string(),mode}),v.null()),handler:async(ctx,args)=>{const row=await ownedCall(ctx,args.sessionId);await invited(ctx);if(!liveCallConfig())throw new ConvexError('Live answer testing is not enabled yet.');const text=await ctx.db.get(args.utteranceId);if(!text||text.sessionId!==row._id||text.speaker!=='customer'||text.processed||text.revision!==row.customerRevision)return null;if(row.detections>=row.maxDetections)throw new ConvexError('The question-detection testing allowance is used up. Stop Cuelo.');await ctx.db.patch(text._id,{processed:true});await ctx.db.patch(row._id,{detections:row.detections+1});return {revision:text.revision,question:text.text,mode:row.mode};}});
export const check=internalQuery({args:{...sessionArg,revision:v.optional(v.number()),generation:v.optional(v.number())},returns:v.boolean(),handler:async(ctx,args)=>{try{const row=await ownedCall(ctx,args.sessionId);await invited(ctx);return !!liveCallConfig()&&(args.revision===undefined||row.customerRevision===args.revision)&&(args.generation===undefined||row.generation===args.generation);}catch{return false;}}});
export const reserveAnswer=internalMutation({args:{...sessionArg,revision:v.number()},returns:v.null(),handler:async(ctx,args)=>{const row=await ownedCall(ctx,args.sessionId);await invited(ctx);if(!liveCallConfig())throw new ConvexError('Live answer testing is not enabled yet.');if(row.customerRevision!==args.revision)throw new ConvexError('This answer was cancelled.');if(row.answers>=row.maxAnswers)throw new ConvexError('The live answer testing allowance is used up. Stop Cuelo.');await ctx.db.patch(row._id,{answers:row.answers+1});return null;}});
export const context=internalQuery({args:{...sessionArg,question:v.string(),throughSequence:v.optional(v.number())},returns:v.object({conversation:v.array(v.object({speaker:v.union(v.literal('customer'),v.literal('salesperson')),text:v.string()})),source:v.union(sourceMetaValue,v.null()),passages:v.array(passageValue)}),handler:async(ctx,args)=>{
 const row=await ownedCall(ctx,args.sessionId);const latest=await ctx.db.query('callText').withIndex('by_session',q=>args.throughSequence===undefined?q.eq('sessionId',row._id):q.eq('sessionId',row._id).lte('sequence',args.throughSequence)).order('desc').take(12);
 const terms=(args.question.toLowerCase().match(/[a-z0-9]{4,}/g)??[]).slice(0,5).join(' ');const related=terms?await ctx.db.query('callText').withSearchIndex('search_text',q=>q.search('text',terms).eq('sessionId',row._id)).take(12):[];
 const rows=[...new Map([...related,...latest].filter(r=>args.throughSequence===undefined||r.sequence<=args.throughSequence).map(r=>[r._id,r])).values()].sort((a,b)=>a.sequence-b.sequence);
 let source=null;let passages:Array<{ordinal:number;reference:string;text:string}>=[];
 if(row.sourceId){const s=await ctx.db.get(row.sourceId);if(!s||s.ownerKey!==row.sourceOwnerKey||s.expiresAt!==null&&s.expiresAt<=Date.now())throw new ConvexError('Your source changed or expired. Stop and confirm it again.');source={id:s._id,title:s.title,kind:s.kind,url:s.url,pageCount:s.pageCount,passageCount:s.passageCount,saved:s.saved,expiresAt:s.expiresAt};passages=(await ctx.db.query('sourcePassages').withIndex('by_source',q=>q.eq('sourceId',s._id)).take(501)).map(p=>({ordinal:p.ordinal,reference:p.reference,text:p.text}));}
 return {conversation:rows.map(r=>({speaker:r.speaker,text:r.text})),source,passages};
}});
export const cleanup=internalMutation({args:{},returns:v.null(),handler:async ctx=>{const rows=await ctx.db.query('liveCalls').withIndex('by_expiry',q=>q.lte('expiresAt',Date.now())).take(1);for(const row of rows)await removeText(ctx,row);return null;}});

// Sidebar questions are independent of subsequent speech; generation changes
// only when capture is paused/resumed, never when another turn arrives.
const queuedArg={...sessionArg,utteranceId:v.id('callText'),generation:v.number()};
export const queuedPrepare=internalMutation({args:{...queuedArg,phase:v.union(v.literal('detect'),v.literal('answer'))},returns:v.union(v.object({mode,question:v.string(),sequence:v.number(),cached:v.boolean(),skipped:v.boolean(),answerResult:v.union(liveAnswerResult,v.null())}),v.null()),handler:async(ctx,args)=>{
 const row=await ownedCall(ctx,args.sessionId);await invited(ctx);if(!liveCallConfig()||row.generation!==args.generation)return null;
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
 if(!text.answerReserved){if(row.answers>=row.maxAnswers)throw new ConvexError('The live answer testing allowance is used up. Stop Cuelo.');await ctx.db.patch(row._id,{answers:row.answers+1});}
 await ctx.db.patch(text._id,{answerGeneration:args.generation,answerReserved:true});return base;
}});
export const queuedComplete=internalMutation({args:{...queuedArg,question:v.optional(v.string()),skipped:v.optional(v.boolean()),answered:v.optional(v.boolean()),answerResult:v.optional(liveAnswerResult)},returns:v.boolean(),handler:async(ctx,args)=>{
 const row=await ownedCall(ctx,args.sessionId);await invited(ctx);if(!liveCallConfig()||row.generation!==args.generation)return false;
 const text=await ctx.db.get(args.utteranceId);if(!text||text.sessionId!==row._id||text.speaker!=='customer')return false;
 if(args.answered){if(text.questionStatus!=='question'||text.answerGeneration!==args.generation)return false;if(!args.answerResult)throw new ConvexError('The completed answer is unavailable.');await ctx.db.patch(text._id,{questionStatus:'answered',processed:true,answerResult:args.answerResult});}
 else {if(text.detectionGeneration!==args.generation||text.questionStatus)return false;const question=args.question?.trim();if(!args.skipped&&(!question||question.length>1000))throw new ConvexError('The customer question could not be understood safely.');await ctx.db.patch(text._id,{questionStatus:args.skipped?'skipped':'question',...(question?{question}:{}),processed:!!args.skipped});}
 return true;
}});
