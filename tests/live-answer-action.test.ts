import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getFunctionName} from 'convex/server';
import {Agent} from '@convex-dev/agent';
import {answer} from '../convex/liveAnswers';
const args={sessionId:'made-up-call' as any,utteranceId:'made-up-turn' as any};
const passage={ordinal:0,reference:'Sign-in',text:'The example product includes password sign-in.'};
const source={id:'made-up-source' as any,title:'Example FAQ',kind:'text' as const,url:null,pageCount:null,passageCount:1,saved:true,expiresAt:null};
function context(mode:'document'|'generic'='document'){
 let current=true,prepared=true,reserved=0;
 const ctx={runMutation:async(fn:any)=>{switch(getFunctionName(fn)){case 'liveCalls:prepare':return prepared?{mode,question:'Does it include password sign-in?',revision:1}:null;case 'liveCalls:reserveAnswer':reserved++;return null;default:throw Error('Unexpected mutation');}},runQuery:async(fn:any)=>{switch(getFunctionName(fn)){case 'liveCalls:check':return current;case 'liveCalls:context':return {conversation:[{speaker:'salesperson',text:'We are discussing sign-in.'}],source:mode==='document'?source:null,passages:mode==='document'?[passage]:[]};default:throw Error('Unexpected query');}}};
 return {ctx:ctx as any,cancel:()=>{current=false;},ignore:()=>{prepared=false;},get reserved(){return reserved;}};
}
function mockModel(t:any,generate:(options:any,index:number)=>any){let calls=0,deleted=0;t.mock.method(Agent.prototype,'createThread',async()=>({threadId:`made-up-thread-${calls}`}));t.mock.method(Agent.prototype,'deleteThreadAsync',async()=>{deleted++;});t.mock.method(Agent.prototype,'generateText',async(_ctx:any,_thread:any,options:any,storage:any)=>{assert.equal(options.maxOutputTokens,500);assert.equal(options.providerOptions.openai.store,false);assert.equal(storage.storageOptions.saveMessages,'none');return {text:JSON.stringify(await generate(options,++calls))};});return {get calls(){return calls;},get deleted(){return deleted;}};}
test('live customer detection reuses grounded answers and cleans both private threads',async t=>{const f=context();const model=mockModel(t,(options,index)=>{assert.match(options.prompt,/discussing sign-in/);return index===1?{isQuestion:true,question:'Does it include password sign-in?'}:{status:'supported',bullets:[{text:'It includes password sign-in.',passageIds:[0]}]};});const result=await answer._handler(f.ctx,args);assert.equal(result.status,'supported');assert.equal(result.mode,'document');assert.deepEqual(result.citations,[passage]);assert.equal(f.reserved,1);assert.equal(model.deleted,2);});
test('salesperson or already processed turns and customer statements never generate an answer',async t=>{const f=context();const model=mockModel(t,()=>({isQuestion:false,question:''}));f.ignore();assert.equal((await answer._handler(f.ctx,args)).status,'cancelled');assert.equal(model.calls,0);const statement=context();assert.equal((await answer._handler(statement.ctx,args)).status,'cancelled');assert.equal(model.calls,1);assert.equal(statement.reserved,0);assert.equal(model.deleted,1);});
test('new customer speech cancels stale live output; generic output carries no document evidence',async t=>{const f=context('generic');const model=mockModel(t,(_options,index)=>index===1?{isQuestion:true,question:'What is single sign-on?'}:{status:'generic',companySpecific:false,bullets:[{text:'Single sign-on uses one identity provider.',passageIds:[]}]});const result=await answer._handler(f.ctx,args);assert.equal(result.status,'generic');assert.equal(result.mode,'generic');assert.equal(result.source,null);assert.deepEqual(result.citations,[]);f.cancel();assert.equal((await answer._handler(f.ctx,args)).status,'cancelled');assert.equal(model.calls,2);assert.equal(model.deleted,2);});

test('independent detection uses preceding conversation; generation continues despite newer speech',async t=>{
 const {detectQueued,answerQueued}=await import('../convex/liveAnswers');
 let question='',completed=0;const phases:string[]=[];let latestRevision=1;
 const model=mockModel(t,(options,index)=>{if(index===1){assert.match(options.prompt,/latestCustomerSegment/);assert.match(options.prompt,/discussing sign-in/);latestRevision++;return {isQuestion:true,question:'Does it include password sign-in?'};}latestRevision++;return {status:'supported',bullets:[{text:'It includes password sign-in.',passageIds:[0]}]};});
 const ctx:any={runMutation:async(fn:any,input:any)=>{switch(getFunctionName(fn)){case 'liveCalls:queuedPrepare':phases.push(input.phase);return {mode:'document',question:question||'Does that include sign-in?',sequence:3,cached:false,skipped:false,answerResult:null};case 'liveCalls:queuedComplete':if(input.answered){assert.equal(input.answerResult.status,'supported');completed++;}else question=input.question;return true;default:throw Error('Unexpected mutation');}},runQuery:async(fn:any,input:any)=>{switch(getFunctionName(fn)){case 'liveCalls:check':assert.equal(input.generation,2);assert.equal(input.revision,undefined);return true;case 'liveCalls:context':if(!question)assert.equal(input.throughSequence,3);return {conversation:[{speaker:'salesperson',text:'We are discussing sign-in.'}],source,passages:[passage]};default:throw Error('Unexpected query');}}};
 const input={...args,generation:2};assert.equal((await detectQueued._handler(ctx,input)).status,'question');const response=await answerQueued._handler(ctx,input);assert.equal(response.status,'supported');assert.deepEqual(phases,['detect','answer']);assert.equal(completed,1);assert.equal(model.deleted,2);assert.equal(latestRevision,3);
});
test('ordinary customer conversation is explicitly skipped without an answer call',async t=>{
 const {detectQueued}=await import('../convex/liveAnswers');const model=mockModel(t,()=>({isQuestion:false,question:''}));let skipped=false;
 const ctx:any={runMutation:async(fn:any,input:any)=>getFunctionName(fn)==='liveCalls:queuedPrepare'?{mode:'generic',question:'Our team is growing.',sequence:1,cached:false,skipped:false,answerResult:null}:(skipped=input.skipped,true),runQuery:async(fn:any)=>getFunctionName(fn)==='liveCalls:check'?true:{conversation:[],source:null,passages:[]}};
 assert.equal((await detectQueued._handler(ctx,{...args,generation:1})).status,'skipped');assert.equal(skipped,true);assert.equal(model.calls,1);
});

test('an unsafe queued answer is rejected without losing the next question',async t=>{
 const {answerQueued}=await import('../convex/liveAnswers');
 mockModel(t,(_options,index)=>({status:'supported',bullets:[{text:index===1?'It costs $99.':'It includes password sign-in.',passageIds:[0]}]}));
 const completed:any[]=[];
 const ctx:any={runMutation:async(fn:any,input:any)=>getFunctionName(fn)==='liveCalls:queuedPrepare'?{mode:'document',question:'Does it include sign-in?',sequence:1,cached:false,skipped:false,answerResult:null}:(completed.push(input.answerResult),true),runQuery:async(fn:any)=>getFunctionName(fn)==='liveCalls:check'?true:{conversation:[],source,passages:[passage]}};
 const rejected=await answerQueued._handler(ctx,{...args,generation:1});
 assert.equal((rejected as any).problemCode,'answer_check_failed');assert.deepEqual(rejected.bullets,[]);assert.deepEqual(rejected.citations,[]);assert.match(rejected.message,/Listening continues/);
 const next=await answerQueued._handler(ctx,{...args,utteranceId:'next-turn' as any,generation:1});assert.equal(next.status,'supported');assert.equal(completed.length,2);
});

test('queued generic results have no document evidence, including cached replay',async t=>{
 const {answerQueued}=await import('../convex/liveAnswers');let cached:any=null;
 const model=mockModel(t,()=>({status:'generic',companySpecific:false,bullets:[{text:'Single sign-on uses one identity provider.',passageIds:[]}]}));
 const ctx:any={runMutation:async(fn:any,input:any)=>getFunctionName(fn)==='liveCalls:queuedPrepare'?{mode:'generic',question:'What is single sign-on?',sequence:1,cached:!!cached,skipped:false,answerResult:cached}:(cached=input.answerResult,true),runQuery:async(fn:any)=>getFunctionName(fn)==='liveCalls:check'?true:{conversation:[],source:null,passages:[]}};
 const first=await answerQueued._handler(ctx,{...args,generation:1}),replay=await answerQueued._handler(ctx,{...args,generation:2});
 assert.equal(first.mode,'generic');assert.equal(first.status,'generic');assert.equal(first.source,null);assert.deepEqual(first.citations,[]);assert.deepEqual(replay,first);assert.equal(model.calls,1);
});

test('queued missing evidence refuses without provider use; missing source and provider failures stay distinct',async t=>{
 const {answerQueued}=await import('../convex/liveAnswers');const {ConvexError}=await import('convex/values');
 let kind='no-evidence';
 const model=mockModel(t,()=>{throw Error('SIMULATED provider unavailable');});
 const ctx:any={runMutation:async(fn:any)=>getFunctionName(fn)==='liveCalls:queuedPrepare'?{mode:'document',question:'Does it include sign-in?',sequence:1,cached:false,skipped:false,answerResult:null}:true,runQuery:async(fn:any)=>{if(getFunctionName(fn)==='liveCalls:check')return true;if(kind==='missing-source')throw new ConvexError('Your source changed or expired. Stop and confirm it again.');return {conversation:[],source,passages:kind==='no-evidence'?[]:[passage]};}};
 const missing=await answerQueued._handler(ctx,{...args,generation:1});
 assert.equal(missing.status,'unverified');assert.match(missing.message,/find this in your source/);assert.equal(model.calls,0);
 kind='missing-source';const removed=await answerQueued._handler(ctx,{...args,generation:1});
 assert.equal(removed.status,'error');assert.match(removed.message,/source changed or expired/);assert.equal(model.calls,0);
 kind='provider';const unavailable=await answerQueued._handler(ctx,{...args,generation:1});
 assert.equal(unavailable.status,'error');assert.equal(unavailable.message,'Busy right now. Try again in a few minutes.');assert.equal(model.calls,1);assert.equal(model.deleted,1);
});
