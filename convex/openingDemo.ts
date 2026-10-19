"use node";
import {answerErrorMessage,ANSWER_NOT_FOUND,ANSWER_TIMEOUT} from './answerErrors';
import {action} from './_generated/server';
import {internal} from './_generated/api';
import {v,ConvexError,type Infer} from 'convex/values';
import {finalPublicDiagnostic} from './publicAnswerDiagnostics';
import {validateQuestionAudio} from './speechAudio';
import {generateSelectedAnswer} from './answerGeneration';
import {checkSelectedAnswer,selectAnswerPassages,SELECTED_ANSWER_INSTRUCTIONS,MAX_ANSWER_INPUT_BYTES,MISSING_SOURCE_ANSWER} from './selectedAnswerPolicy';
import {passageValue,sourceMetaValue} from './sourceValues';
const answerValue=v.object({mode:v.union(v.literal('generic'),v.literal('document')),question:v.string(),bullets:v.array(v.string()),message:v.string(),shorteningTimedOut:v.optional(v.boolean()),sourceUnverified:v.optional(v.boolean()),webSources:v.optional(v.array(v.object({url:v.string(),title:v.string()}))),citations:v.array(passageValue),source:v.union(sourceMetaValue,v.null())});
export const ask=action({args:{browserSecret:v.string(),requestKey:v.string(),audio:v.bytes(),sourceId:v.optional(v.id('sources')),guestSecret:v.optional(v.string())},returns:answerValue,handler:async(ctx,args):Promise<Infer<typeof answerValue>>=>{
 const mode=args.sourceId?'document':'generic';const base={mode,question:'',bullets:[],message:'',citations:[],source:null} as Infer<typeof answerValue>;
 const failure=(message:string)=>({...base,message});let admitted=false;
 try{
  validateQuestionAudio(args.audio);
  const loaded=args.sourceId?await ctx.runQuery(internal.sources.answerSource,{id:args.sourceId,guestSecret:args.guestSecret}):null;
  base.source=loaded?.meta??null;
  await ctx.runMutation(internal.openingBudget.admit,{browserSecret:args.browserSecret,requestKey:args.requestKey});admitted=true;
  const response=await fetch('https://api.deepgram.com/v1/listen?model=nova-3&language=en&smart_format=true&mip_opt_out=true',{method:'POST',headers:{Authorization:`Token ${process.env.DEEPGRAM_API_KEY}`,'Content-Type':'audio/wav'},body:args.audio,signal:AbortSignal.timeout(25000)});
  if(!response.ok){if(response.status===400||response.status===415)return failure('The microphone audio could not be read. Please try again.');return failure(answerErrorMessage({statusCode:response.status}));}
  const data=await response.json();const alternative=data?.results?.channels?.[0]?.alternatives?.[0];
  const question=typeof alternative?.transcript==='string'?alternative.transcript.trim():'';
  if(!question||typeof alternative?.confidence!=='number'||alternative.confidence<.5)return failure('I couldn’t hear a clear question. Please try again.');
  if(question.length>1000)return failure('That question is too long. Please ask a shorter question.');
  base.question=question;
  const evidence=loaded?selectAnswerPassages(loaded.passages,question):[];
  if(loaded&&!evidence.length)return failure(MISSING_SOURCE_ANSWER);
  const prompt=JSON.stringify({mode,question,source:loaded?{title:loaded.meta.title,passages:evidence}:null});
  if(new TextEncoder().encode(prompt+SELECTED_ANSWER_INSTRUCTIONS).byteLength>MAX_ANSWER_INPUT_BYTES)return failure('Please ask a narrower question about your document.');
  const generated=await generateSelectedAnswer(ctx,prompt,AbortSignal.timeout(30000));
  if(args.sourceId)await ctx.runQuery(internal.sources.answerSource,{id:args.sourceId,guestSecret:args.guestSecret});
  let raw:unknown;try{raw=JSON.parse(generated.text);}catch{return failure(ANSWER_NOT_FOUND);}
  const checked=checkSelectedAnswer(raw,mode,evidence,generated.webSources,generated.sourceUnverified);
  if(mode==='generic')finalPublicDiagnostic(raw,checked.status==='generic');
  return {...base,...(checked.shorteningTimedOut?{shorteningTimedOut:true}:{}),...(checked.sourceUnverified!==undefined?{sourceUnverified:checked.sourceUnverified}:{}),bullets:checked.bullets,message:checked.message,citations:checked.citations,...(checked.webSources?{webSources:checked.webSources}:{})};
 }catch(error){return failure(answerErrorMessage(error));}
 finally{if(admitted)await ctx.runMutation(internal.openingBudget.release,{browserSecret:args.browserSecret,requestKey:args.requestKey});}
}});
