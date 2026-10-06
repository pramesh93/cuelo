import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getFunctionName} from 'convex/server';
import {Agent} from '@convex-dev/agent';
import {ConvexError} from 'convex/values';
import {ask} from '../convex/selectedAnswers';
const meta={id:'made-up-source' as any,title:'Example product FAQ',kind:'text' as const,url:null,pageCount:null,passageCount:1,saved:false,expiresAt:Date.now()+3600000};
const passage={ordinal:0,reference:'Passage 1',text:'The made-up product includes password sign-in.'};
const args={guestSecret:'a'.repeat(64),visitSecret:'a'.repeat(64),requestKey:'12345678-1234-1234-1234-123456789012',mode:'document' as const,sourceId:meta.id,question:'Does it include password sign-in?'};
function context({denied=false,enabled=true,deleted=false,cancelled=false}:{denied?:boolean;enabled?:boolean;deleted?:boolean;cancelled?:boolean}={}){
 let reads=0;const finishes:boolean[]=[];let admissions=0;
 const ctx={runQuery:async(fn:any)=>{const name=getFunctionName(fn);if(name==='sources:check')return 'guest:example';if(name==='sources:answerSource'){reads++;if(denied||deleted&&reads>1)throw new ConvexError('This source was deleted, replaced or expired.');return {meta,passages:[passage]};}if(name==='selectedAnswerBudget:cancelled')return cancelled;throw new Error(name);},
 runMutation:async(fn:any,params:any)=>{const name=getFunctionName(fn);if(name==='selectedAnswerBudget:admit'){admissions++;if(!enabled)throw new ConvexError('Live answer checks are not enabled yet.');return {remaining:5,budgetAlert:false};}if(name==='selectedAnswerBudget:finish'){finishes.push(params.successful);return !cancelled;}throw new Error(name);}};
 return {ctx:ctx as any,finishes,get admissions(){return admissions;}};
}
test('inaccessible sources and disabled testing never reach a model; generic mode cannot smuggle a source',async t=>{
 const key=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='fake-test-key';let calls=0;t.mock.method(Agent.prototype,'generateText',async()=>{calls++;throw new Error('Must not call provider');});
 try{const denied=context({denied:true});assert.equal((await ask._handler(denied.ctx,args)).status,'error');assert.equal(denied.admissions,0);
 const disabled=context({enabled:false});assert.match((await ask._handler(disabled.ctx,args)).message,/not enabled/);
 const generic=context();assert.match((await ask._handler(generic.ctx,{...args,mode:'generic'})).message,/cannot include/);assert.equal(generic.admissions,0);assert.equal(calls,0);
 }finally{if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;}
});
test('generated answers use private fresh threads, exact source provenance and cleanup; deletion cancels stale output',async t=>{
 const key=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='fake-test-key';let created=0,deleted=0;const prompts:string[]=[];
 t.mock.method(Agent.prototype,'createThread',async()=>({threadId:`made-up-thread-${++created}`}));t.mock.method(Agent.prototype,'deleteThreadAsync',async()=>{deleted++;});
 t.mock.method(Agent.prototype,'generateText',async(_ctx:any,_thread:any,options:any,storage:any)=>{assert.equal(options.maxOutputTokens,500);assert.equal(options.maxRetries,0);assert.equal(options.providerOptions.openai.store,false);assert.equal(storage.storageOptions.saveMessages,'none');prompts.push(options.prompt);return {text:JSON.stringify({status:'supported',bullets:[{text:'It includes password sign-in.',passageIds:[0]}]})};});
 try{const f=context();const response=await ask._handler(f.ctx,args);assert.equal(response.status,'supported');assert.deepEqual(response.citations,[passage]);assert.deepEqual(response.source,meta);assert.deepEqual(f.finishes,[true]);
 const changed=context({deleted:true});assert.equal((await ask._handler(changed.ctx,args)).status,'error');assert.deepEqual(changed.finishes,[false]);assert.equal(created,2);assert.equal(deleted,2);
 const aborted=context({cancelled:true});assert.equal((await ask._handler(aborted.ctx,args)).status,'cancelled');assert.equal(created,2);assert.deepEqual(aborted.finishes,[false]);assert.match(prompts[0],/made-up product/);
 }finally{if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;}
});

test('cancellation during generation aborts the model request and does not consume a successful visit answer',async t=>{
 const key=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='fake-test-key';const f=context();let generationStarted=false,aborted=false;
 const runQuery=f.ctx.runQuery;f.ctx.runQuery=async(fn:any,...params:any[])=>getFunctionName(fn)==='selectedAnswerBudget:cancelled'?generationStarted:runQuery(fn,...params);
 t.mock.method(Agent.prototype,'createThread',async()=>({threadId:'made-up-abort-thread'}));t.mock.method(Agent.prototype,'deleteThreadAsync',async()=>{});
 t.mock.method(Agent.prototype,'generateText',async(_ctx:any,_thread:any,options:any)=>{generationStarted=true;return await new Promise((_resolve,reject)=>options.abortSignal.addEventListener('abort',()=>{aborted=true;reject(new Error('Simulated cancellation'));},{once:true}));});
 try{assert.equal((await ask._handler(f.ctx,args)).status,'cancelled');assert.equal(aborted,true);assert.deepEqual(f.finishes,[false]);}finally{if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;}
});

test('generic results have backend provenance and invalid model evidence does not consume the visit allowance',async t=>{
 const key=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='fake-test-key';let output:any={status:'generic',companySpecific:false,bullets:[{text:'Single sign-on uses one identity provider.',passageIds:[]}]};
 t.mock.method(Agent.prototype,'createThread',async()=>({threadId:'made-up-validation-thread'}));t.mock.method(Agent.prototype,'deleteThreadAsync',async()=>{});
 t.mock.method(Agent.prototype,'generateText',async()=>({text:JSON.stringify(output)}));
 try{const generic=context();const answer=await ask._handler(generic.ctx,{...args,mode:'generic',sourceId:undefined});assert.equal(answer.mode,'generic');assert.equal(answer.status,'generic');assert.equal(answer.source,null);assert.deepEqual(answer.citations,[]);
 output={status:'supported',bullets:[{text:'It includes password sign-in.',passageIds:[999]}]};const invalid=context();assert.equal((await ask._handler(invalid.ctx,args)).status,'error');assert.deepEqual(invalid.finishes,[false]);
 }finally{if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;}
});
