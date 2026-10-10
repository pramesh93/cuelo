"use node";
import {action} from './_generated/server';
import {internal} from './_generated/api';
import {v,ConvexError} from 'convex/values';
import {generateSelectedAnswer} from './answerGeneration';
import {passageValue,sourceScopeArgs,sourceMetaValue} from './sourceValues';
import type {Infer} from 'convex/values';
import {checkSelectedAnswer,selectAnswerPassages,SELECTED_ANSWER_INSTRUCTIONS,MAX_ANSWER_INPUT_BYTES,MISSING_SOURCE_ANSWER} from './selectedAnswerPolicy';
const mode=v.union(v.literal('generic'),v.literal('document'));
const result=v.object({mode,status:v.union(v.literal('supported'),v.literal('unverified'),v.literal('conflict'),v.literal('generic'),v.literal('error'),v.literal('cancelled')),bullets:v.array(v.string()),message:v.string(),citations:v.array(passageValue),source:v.union(sourceMetaValue,v.null()),elapsedMs:v.number(),budgetAlert:v.boolean()});
export const ask=action({args:{...sourceScopeArgs,visitSecret:v.string(),requestKey:v.string(),mode,sourceId:v.optional(v.id('sources')),question:v.string()},returns:result,handler:async(ctx,args):Promise<Infer<typeof result>>=>{
 const started=Date.now();const base={mode:args.mode,bullets:[],citations:[],source:null,elapsedMs:0,budgetAlert:false};
 const failure=(message:string,status:'error'|'cancelled'='error'):Infer<typeof result>=>({...base,status,message,elapsedMs:Date.now()-started});
 const question=args.question.trim();if(!question||question.length>1000)return failure('Enter a question of 1–1,000 characters.');
 let source:Infer<typeof sourceMetaValue>|null=null;let evidence:Infer<typeof passageValue>[]=[];
 // Validate capability and source BEFORE reserving any paid usage.
 try {
  await ctx.runQuery(internal.sources.check,{guestSecret:args.visitSecret});
  if(args.mode==='document'){
   if(!args.sourceId)return failure('Choose a source before asking in document mode.');
   const loaded=await ctx.runQuery(internal.sources.answerSource,{guestSecret:args.guestSecret,id:args.sourceId});source=loaded.meta;evidence=selectAnswerPassages(loaded.passages,question);
   if(!evidence.length)return {...base,status:'unverified',message:MISSING_SOURCE_ANSWER,source,elapsedMs:Date.now()-started};
  }else if(args.sourceId)return failure('Generic mode cannot include a document. Choose the answer mode again.');
 }catch(error){return failure(error instanceof ConvexError&&typeof error.data==='string'?error.data:error instanceof Error?error.message:'Your source is unavailable. Add or confirm it again.');}
 const prompt=JSON.stringify({mode:args.mode,question,source:source?{title:source.title,passages:evidence}:null});
 if(new TextEncoder().encode(prompt+SELECTED_ANSWER_INSTRUCTIONS).byteLength>MAX_ANSWER_INPUT_BYTES)return failure('The question and related evidence exceed the answer input limit. Ask a narrower question. No paid request was made.');
 if(!process.env.OPENAI_API_KEY)return failure('Real answers are not configured yet.');
 let admitted;
 try {admitted=await ctx.runMutation(internal.selectedAnswerBudget.admit,{visitSecret:args.visitSecret,requestKey:args.requestKey});}
 catch(error){return failure(error instanceof ConvexError&&typeof error.data==='string'?error.data:'Real answer testing is unavailable right now.');}
 const controller=new AbortController();let finished=false,polling=false;let timeout:ReturnType<typeof setTimeout>|undefined;let timer:ReturnType<typeof setInterval>|undefined;
 const cancelled=()=>ctx.runQuery(internal.selectedAnswerBudget.cancelled,{visitSecret:args.visitSecret,requestKey:args.requestKey});
 try {
  if(await cancelled())return failure('This answer was cancelled.','cancelled');
  timeout=setTimeout(()=>controller.abort(),30000);
  timer=setInterval(()=>{if(polling)return;polling=true;void cancelled().then(value=>{if(value)controller.abort();}).catch(()=>controller.abort()).finally(()=>{polling=false;});},500);
  const generated=await generateSelectedAnswer(ctx,prompt,controller.signal);
  if(await cancelled())return failure('This answer was cancelled.','cancelled');
  if(source&&args.sourceId)await ctx.runQuery(internal.sources.answerSource,{guestSecret:args.guestSecret,id:args.sourceId});
  let raw:unknown;try{raw=JSON.parse(generated.text);}catch{return failure('The answer could not be checked. Try again.');}
  const checked=checkSelectedAnswer(raw,args.mode,evidence);
  const declared=raw && typeof raw==='object' && 'status' in raw ? raw.status : null;
  if(!['supported','generic','unverified','conflict'].includes(String(declared)) ||
     ((declared==='supported'||declared==='generic') && checked.status==='unverified'))
   return failure('The answer could not be checked. Try again.');
  const accepted=await ctx.runMutation(internal.selectedAnswerBudget.finish,{visitSecret:args.visitSecret,requestKey:args.requestKey,successful:true});finished=true;
  if(!accepted)return failure('This answer was cancelled.','cancelled');
  return {...checked,mode:args.mode,source,elapsedMs:Date.now()-started,budgetAlert:admitted.budgetAlert};
 }catch(error){
  if(await cancelled().catch(()=>true))return failure('This answer was cancelled.','cancelled');
  if(error instanceof ConvexError&&typeof error.data==='string')return failure(error.data);
  // Do not put questions, passages, provider messages or responses in routine logs.
  console.error('Cuelo selected answer failed',{step:'generation_or_cleanup'});
  return failure('Busy right now. Try again in a few minutes.');
 }finally{
  if(timer)clearInterval(timer);if(timeout)clearTimeout(timeout);
  if(!finished)await ctx.runMutation(internal.selectedAnswerBudget.finish,{visitSecret:args.visitSecret,requestKey:args.requestKey,successful:false});
 }
}});
