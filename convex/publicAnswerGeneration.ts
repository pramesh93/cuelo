"use node";
import {beginShortening,endShortening,duringShortening,ShorteningTimeout,shorteningFallback} from './shortening';
import {repairAnswer,type RepairBudget} from './answerRepair';
import {ANSWER_NOT_FOUND,CUELO_UNAVAILABLE,BUDGET_EXHAUSTED} from './answerErrors';
import {Agent} from '@convex-dev/agent';
import {openai} from '@ai-sdk/openai';
import {publicDiagnostic} from './publicAnswerDiagnostics';
import {randomUUID} from 'node:crypto';
import {ConvexError} from 'convex/values';
import {components,internal} from './_generated/api';
import type {ActionCtx} from './_generated/server';
import {providerWebSources,searchQuestion,PUBLIC_ROUTING_INSTRUCTIONS,PUBLIC_SEARCH_INSTRUCTIONS,PUBLIC_FORMAT_INSTRUCTIONS,PUBLIC_SEARCH_MAX_CALLS,PUBLIC_SEARCH_RESERVATION_PAISE,PUBLIC_UNVERIFIED,type WebSource} from './publicAnswerPolicy';
const currentQuestion=/\b(pric(?:e|es|ing)|costs?|plans?|latest|current|today|news|integrations?|availability|available|supports?)\b/i;
export async function generatePublicAnswer(ctx:ActionCtx,prompt:string,signal:AbortSignal,repairBudget:RepairBudget={used:false}){
 if(signal.aborted)throw signal.reason??Error('Cancelled');
 const input=JSON.parse(prompt);const {question,conversation}=input;
 if(typeof question!=='string'||question.length>1000)throw new ConvexError('Ask a shorter question.');
 const route=new Agent(components.agent,{name:'Cuelo public answer routing',languageModel:openai.chat('gpt-4.1'),instructions:PUBLIC_ROUTING_INSTRUCTIONS});
 const {threadId}=await route.createThread(ctx);let planned;
 try{planned=await route.generateText(ctx,{threadId},{prompt:JSON.stringify({question,conversation}),maxOutputTokens:500,maxRetries:0,abortSignal:signal,providerOptions:{openai:{store:false}}},{storageOptions:{saveMessages:'none'}});}finally{await route.deleteThreadAsync(ctx,{threadId});}
 if(signal.aborted)throw signal.reason??Error('Cancelled');
 const decision=await repairAnswer(ctx,planned.text,'route','generic',{question,conversation},signal,repairBudget);
 publicDiagnostic(decision.status==='search'?'routing_search':decision.status==='generic'?'routing_generic':decision.status==='unverified'?'routing_unverified':'routing_invalid');
 if(decision.status==='unverified'||decision.status!=='search'&&!currentQuestion.test(question))return {...planned,text:JSON.stringify(decision),sourceUnverified:decision.status==='generic',webSources:undefined as WebSource[]|undefined};
 if(process.env.PUBLIC_WEB_SEARCH_ENABLED!=='true')throw new ConvexError(CUELO_UNAVAILABLE);
 let publicQuestion:string;try{publicQuestion=searchQuestion(decision.publicQuestion??question);}catch(error){throw new ConvexError((error as Error).message);}
 const reservation=await ctx.runMutation(internal.spending.reserve,{key:`public-search-${randomUUID()}`,purpose:'opening',amountPaise:PUBLIC_SEARCH_RESERVATION_PAISE,...(repairBudget.sessionId?{sessionId:repairBudget.sessionId}:{})});
 if(reservation.status!=='reserved')throw new ConvexError(reservation.status==='exhausted'?BUDGET_EXHAUSTED:CUELO_UNAVAILABLE);
 if(signal.aborted)throw signal.reason??Error('Cancelled');
 const search=new Agent(components.agent,{name:'Cuelo public web answers',languageModel:openai.responses('gpt-4.1'),instructions:PUBLIC_SEARCH_INSTRUCTIONS,tools:{web_search:openai.tools.webSearch({searchContextSize:'low',externalWebAccess:true})}});
 const searchThread=await search.createThread(ctx);
 try{
  const generated=await search.generateText(ctx,searchThread,{prompt:publicQuestion,toolChoice:'required',maxOutputTokens:500,maxRetries:0,abortSignal:signal,providerOptions:{openai:{store:false,maxToolCalls:PUBLIC_SEARCH_MAX_CALLS,includeWebSearchSources:true,parallelToolCalls:false}}},{storageOptions:{saveMessages:'none'}});
  if(signal.aborted)throw signal.reason??Error('Cancelled');
  const webSources=providerWebSources(generated);
  publicDiagnostic('search_generic',{sourceCount:webSources.length,inlineCount:generated.sources?.length??0,toolResultCount:generated.toolResults?.length??0,providerExecutedCount:generated.toolResults?.filter(r=>r.providerExecuted===true).length??0});
  const refusal=()=>({...generated,text:JSON.stringify({status:'unverified',companySpecific:false,bullets:[],message:ANSWER_NOT_FOUND}),sourceUnverified:false,webSources:undefined as WebSource[]|undefined});
  if(!generated.text?.trim())return refusal();
  if(!webSources.length)publicDiagnostic('missing_provider_sources');
  const formatPrompt=JSON.stringify({question:publicQuestion,answer:generated.text,sources:webSources.map((source,id)=>({id,...source}))});
  if(new TextEncoder().encode(formatPrompt).byteLength>32000)throw new ConvexError('The search result is too large to shorten safely. Try a narrower question.');
  const formatter=new Agent(components.agent,{name:'Cuelo short public answer',languageModel:openai.chat('gpt-4.1'),instructions:PUBLIC_FORMAT_INSTRUCTIONS});
  const timedOut=()=>({...generated,text:JSON.stringify(shorteningFallback()),sourceUnverified:!webSources.length,webSources});
  const ownsWindow=!repairBudget.shortening;
  let activeFormatThread:{threadId:string}|undefined,formatCleanup:Promise<unknown>|undefined;
  const cleanupFormat=()=>activeFormatThread?(formatCleanup??=formatter.deleteThreadAsync(ctx,activeFormatThread)):Promise.resolve();
  if(generated.text.trim().split(/\s+/u).length>40)beginShortening(repairBudget);
  try{
   return await duringShortening(repairBudget,signal,async formatSignal=>{
    const formatThread=await formatter.createThread(ctx);activeFormatThread=formatThread;
    try{
     if(formatSignal.aborted)throw formatSignal.reason;
     const formatted=await formatter.generateText(ctx,formatThread,{prompt:formatPrompt,maxOutputTokens:500,maxRetries:0,abortSignal:formatSignal,providerOptions:{openai:{store:false}}},{storageOptions:{saveMessages:'none'}});
     if(formatSignal.aborted)throw formatSignal.reason;
     const raw=await repairAnswer(ctx,formatted.text,'public','generic',{question:publicQuestion,answer:generated.text,sources:webSources.map((source,id)=>({id,...source}))},formatSignal,repairBudget);
     endShortening(repairBudget);
     if(raw.shorteningTimedOut)return timedOut();
     if(raw.status==='conflict')return {...formatted,text:JSON.stringify({status:'conflict',conflictKind:/\b(pric|cost)/i.test(publicQuestion)?'prices':'details',companySpecific:false,bullets:[]}),sourceUnverified:!webSources.length,webSources};
     if(raw.status!=='generic'||!Array.isArray(raw.bullets)||!raw.bullets.length||raw.bullets.length>3){publicDiagnostic('search_unverified');return refusal();}
     const used=new Set<number>();const bullets=[];let sourceUnverified=false;
     for(const bullet of raw.bullets){
      const ids=Array.isArray(bullet.sourceIds)?[...new Set<number>(bullet.sourceIds.filter((id:unknown):id is number=>Number.isInteger(id)&&!!webSources[id as number]))]:[];
      if(ids.length!==bullet.sourceIds?.length||!ids.length)sourceUnverified=true;
      for(const id of ids)used.add(id);
      bullets.push({text:bullet.text,passageIds:[],sourceUrls:ids.map(id=>webSources[id].url)});
     }
     return {...formatted,text:JSON.stringify({status:'generic',companySpecific:false,bullets}),sourceUnverified,webSources:webSources.filter((_source,id)=>used.has(id))};
    }finally{await cleanupFormat();}
   });
  }catch(error){if(error instanceof ShorteningTimeout&&!signal.aborted)return timedOut();throw error;}
  finally{if(ownsWindow)endShortening(repairBudget);await cleanupFormat();}
 }finally{await search.deleteThreadAsync(ctx,searchThread);}
}
