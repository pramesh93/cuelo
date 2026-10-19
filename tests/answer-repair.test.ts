import {test} from 'node:test';import assert from 'node:assert/strict';import {Agent} from '@convex-dev/agent';
import {repairAnswer,ANSWER_REPAIR_RESERVATION_PAISE} from '../convex/answerRepair';
import {answerWords,needsAnswerRepair,parseAnswerJSON,repairPreservesDetails} from '../convex/answerRepairPolicy';
import {checkSelectedAnswer} from '../convex/selectedAnswerPolicy';
import {answerErrorMessage,ANSWER_NOT_FOUND,CONTACT_CUELO,CUELO_UNAVAILABLE,BUDGET_EXHAUSTED,ANSWER_TIMEOUT,SERVICE_UNAVAILABLE} from '../convex/answerErrors';
const signal=()=>new AbortController().signal;
const answer=(text:string)=>({status:'generic',companySpecific:false,bullets:[{text,passageIds:[]}]});
function setup(t:any,output:any){let calls=0,deleted=0,reserved=0;t.mock.method(Agent.prototype,'createThread',async()=>({threadId:'fictional-repair'}));t.mock.method(Agent.prototype,'deleteThreadAsync',async()=>{deleted++;});t.mock.method(Agent.prototype,'generateText',async(_ctx:any,_thread:any,args:any,storage:any)=>{calls++;assert.equal(args.maxRetries,0);assert.equal(args.providerOptions.openai.store,false);assert.equal(storage.storageOptions.saveMessages,'none');return {text:typeof output==='string'?output:JSON.stringify(output)};});const ctx:any={runMutation:async(_fn:any,args:any)=>{reserved++;assert.equal(args.amountPaise,ANSWER_REPAIR_RESERVATION_PAISE);return {status:'reserved'};}};return {ctx,get calls(){return calls;},get deleted(){return deleted;},get reserved(){return reserved;}};}
test('46-word answer is compressed before final validation rather than rejected as missing evidence',async t=>{
 const long=answer('word '.repeat(46));const h=setup(t,answer('A brief fictional answer.'));const budget={used:false};const out=await repairAnswer(h.ctx,JSON.stringify(long),'selected','generic',{},signal(),budget);assert.equal(answerWords(out),4);assert.equal(checkSelectedAnswer(out,'generic',[]).status,'generic');assert.equal(h.calls,1);assert.equal(h.reserved,1);assert.equal(h.deleted,1);assert.equal(budget.used,true);
});
test('short answers and JSON fences need no additional provider call or budget reservation',async t=>{
 const h=setup(t,answer('Unused.'));const raw=answer('A concise answer.');assert.deepEqual(await repairAnswer(h.ctx,'```json\n'+JSON.stringify(raw)+'\n```','selected','generic',{},signal(),{used:false}),raw);assert.equal(h.calls,0);assert.equal(h.reserved,0);
});
test('unreadable output gets one repair; still unreadable or overlong returns Answer not found without retries',async t=>{
 const h=setup(t,'still unreadable');await assert.rejects(()=>repairAnswer(h.ctx,'bad JSON','selected','generic',{},signal(),{used:false}),/Answer not found/);assert.equal(h.calls,1);assert.equal(h.deleted,1);
 await assert.rejects(()=>repairAnswer(h.ctx,'bad JSON','selected','generic',{},signal(),{used:true}),/Answer not found/);assert.equal(h.calls,1);
});
test('repair spending denial and pre-cancellation never call the model',async t=>{
 const h=setup(t,answer('Unused.'));h.ctx.runMutation=async()=>({status:'exhausted'});await assert.rejects(()=>repairAnswer(h.ctx,'bad','selected','generic',{},signal(),{used:false}),/budget has been exhausted/);assert.equal(h.calls,0);const c=new AbortController();c.abort(new Error('Cancelled'));await assert.rejects(()=>repairAnswer(h.ctx,'bad','selected','generic',{},c.signal,{used:false}),/Cancelled/);assert.equal(h.calls,0);
});
test('source warning belongs only to generic answers, never replaces document evidence',()=>{
 const out=checkSelectedAnswer(answer('A public explanation.'),'generic',[]);assert.equal(out.sourceUnverified,true);
 const doc=checkSelectedAnswer({status:'supported',bullets:[{text:'Email support is included.',passageIds:[0]}]},'document',[{ordinal:0,reference:'Support',text:'Email support is included.'}],[],true);assert.equal(doc.status,'supported');assert.equal(doc.sourceUnverified,undefined);
 assert.equal(checkSelectedAnswer({status:'supported',bullets:[{text:'Phone support is included.',passageIds:[99]}]},'document',[]).status,'unverified');
});
test('generic conflicts explain disagreement with genuine links; document conflicts stay source-only',()=>{
 const sources=[{url:'https://example.com/pricing',title:'Pricing'}];const out=checkSelectedAnswer({status:'conflict',conflictKind:'prices'},'generic',[],sources);assert.equal(out.status,'conflict');assert.equal(out.message,'These sources show different prices, and I couldn’t confirm which applies. Please check the linked sources.');assert.deepEqual(out.webSources,sources);assert.deepEqual(out.bullets,[]);
});
test('service, internal setup, quota, timeout and user allowance remain separate without raw error leakage',()=>{
 assert.equal(answerErrorMessage({statusCode:503}),SERVICE_UNAVAILABLE);assert.equal(answerErrorMessage({statusCode:401}),CONTACT_CUELO);assert.equal(answerErrorMessage({statusCode:402}),BUDGET_EXHAUSTED);assert.equal(answerErrorMessage({statusCode:429}),'Busy right now. Try again in a few minutes.');assert.equal(answerErrorMessage({name:'TimeoutError'}),ANSWER_TIMEOUT);assert.equal(answerErrorMessage(new Error('fictional secret')),CONTACT_CUELO);
});
test('empty or unsafe content needs repair, refusals do not invent a replacement',()=>{assert.equal(needsAnswerRepair(null,'selected','generic'),true);assert.equal(needsAnswerRepair(answer('<unsafe>'),'selected','generic'),true);assert.equal(needsAnswerRepair({status:'unverified',bullets:[]},'selected','generic'),false);assert.equal(parseAnswerJSON('invalid'),null);assert.equal(ANSWER_NOT_FOUND,'Answer not found.');});

test('compression cannot invent prices, drop annual billing or remove an exception',()=>{
 const a=answer('The plan costs $10 per user monthly, except for annual billing.');
 assert.equal(repairPreservesDetails(a,answer('It costs $10 per user monthly, except with annual billing.')),true);
 for(const text of ['It costs $12 per user monthly, except with annual billing.','It costs $10 monthly.','It costs $10 per user monthly with annual billing.'])assert.equal(repairPreservesDetails(a,answer(text)),false);
});


test('document answers use the same compression step and keep exact evidence IDs',async t=>{
 const {generateSelectedAnswer}=await import('../convex/answerGeneration');let calls=0;let held=0;
 t.mock.method(Agent.prototype,'createThread',async()=>({threadId:'fictional-document'}));t.mock.method(Agent.prototype,'deleteThreadAsync',async()=>{});
 t.mock.method(Agent.prototype,'generateText',async()=>({text:JSON.stringify({status:'supported',bullets:[{text:++calls===1?'Email support is included. '+'extra '.repeat(42):'Email support is included.',passageIds:[0]}]})}));
 const evidence=[{ordinal:0,reference:'Support',text:'Email support is included.'}];const ctx:any={runMutation:async()=>{held++;return {status:'reserved'};}};
 const out=await generateSelectedAnswer(ctx,JSON.stringify({mode:'document',question:'Is support included?',source:{passages:evidence}}),signal());const raw=JSON.parse(out.text);assert.equal(answerWords(raw),4);assert.deepEqual(raw.bullets[0].passageIds,[0]);assert.equal(checkSelectedAnswer(raw,'document',evidence).status,'supported');assert.equal(calls,2);assert.equal(held,1);
});
test('document source failure on one independent bullet keeps supported content and explicitly notes the gap',async t=>{
 const {generateSelectedAnswer}=await import('../convex/answerGeneration');const h=setup(t,{status:'supported',bullets:[{text:'Email support is included.',passageIds:[0]},{text:'Phone support is included.',passageIds:[99]}]});
 const evidence=[{ordinal:0,reference:'Support',text:'Email support is included.'}];const out=await generateSelectedAnswer(h.ctx,JSON.stringify({mode:'document',question:'What support is included?',source:{passages:evidence}}),signal());const raw=JSON.parse(out.text);const checked=checkSelectedAnswer(raw,'document',evidence);assert.equal(checked.bullets.length,1);assert.match(checked.message,/weren’t supported/);assert.equal(checked.citations.length,1);assert.equal(h.reserved,0);
});
test('cancellation during compression deletes its thread and does not return an answer',async t=>{
 const h=setup(t,answer('Unused.'));const c=new AbortController();t.mock.method(Agent.prototype,'generateText',async()=>{c.abort(new Error('Cancelled'));return {text:JSON.stringify(answer('Late answer.'))};});await assert.rejects(()=>repairAnswer(h.ctx,'bad JSON','selected','generic',{},c.signal,{used:false}),/Cancelled/);assert.equal(h.deleted,1);
});



test('development test cap is explained separately from spending limits and customer trial limits',async()=>{
 const {ConvexError}=await import('convex/values');const {WEBSITE_TEST_LIMIT}=await import('../convex/answerErrors');assert.equal(answerErrorMessage(new ConvexError(WEBSITE_TEST_LIMIT)),WEBSITE_TEST_LIMIT);assert.equal(answerErrorMessage(new ConvexError('The voice demo budget is reached.')),BUDGET_EXHAUSTED);assert.equal(answerErrorMessage(new ConvexError('Sign in to keep using Cuelo.')),'Sign in to keep using Cuelo.');
});

test('generic SSO paraphrasing does not require negative or need wording, while sourced facts remain strict',()=>{
 const original=answer('Single sign-on, or SSO, lets users sign in once to access several applications. They do not need to enter separate credentials for each app. It can make access simpler and reduce the number of passwords people need to remember through a shared trusted identity provider.');
 const short=answer('SSO means single sign-on: one sign-in gives you access to multiple apps through a shared identity provider.');assert.equal(answerWords(original),45);assert.equal(answerWords(short),17);assert.equal(repairPreservesDetails(original,short,'generic'),true);assert.equal(repairPreservesDetails(original,short,'document'),false);assert.equal(repairPreservesDetails(original,short,'public'),false);
 assert.equal(repairPreservesDetails(answer('Access is available only if approval is granted.'),answer('Access is available.'),'generic'),false);
 assert.equal(repairPreservesDetails(answer('The plan costs $10 per user monthly.'),answer('The plan costs $12 per user monthly.'),'generic'),false);
 assert.equal(repairPreservesDetails(answer('SSO is not available.'),answer('SSO is available.'),'public'),false);
});
test('the formerly rejected SSO explanation now succeeds on its first shortening attempt',async t=>{
 const original=answer('Single sign-on lets users sign in once to access several applications. They do not need to enter separate credentials for each app. It can make access simpler and reduce the number of passwords people need to remember through a shared trusted identity provider.');const short=answer('SSO means single sign-on: one sign-in gives you access to multiple apps through a shared identity provider.');const h=setup(t,short);const raw=await repairAnswer(h.ctx,JSON.stringify(original),'route','generic',{question:'What is SSO?'},signal(),{used:false});assert.equal(raw.bullets[0].text,short.bullets[0].text);assert.equal(h.calls,1);assert.equal(raw.shorteningTimedOut,undefined);
});

test('budget exhaustion and production trial exhaustion retain their exact reason through repeated error handling',async()=>{
 const {ConvexError}=await import('convex/values');const {TRIAL_ENDED}=await import('../convex/freeTrial');
 for(const message of ['The testing budget is reached. New paid sessions have stopped.','The voice demo budget is reached. Please try again later.',BUDGET_EXHAUSTED])assert.equal(answerErrorMessage(new ConvexError(message)),BUDGET_EXHAUSTED);
 assert.equal(answerErrorMessage({data:{error:{code:'insufficient_quota'}}}),BUDGET_EXHAUSTED);
 assert.equal(answerErrorMessage(new ConvexError(TRIAL_ENDED)),TRIAL_ENDED);
 assert.equal(answerErrorMessage({cause:new ConvexError(TRIAL_ENDED)}),TRIAL_ENDED);
 assert.equal(answerErrorMessage(new ConvexError(answerErrorMessage(new ConvexError(BUDGET_EXHAUSTED)))),BUDGET_EXHAUSTED);
 const allowance='The live-call testing allowance is used up.';assert.equal(answerErrorMessage(new ConvexError(allowance)),allowance);
});

test('shortening attaches the server-selected call pool to its spending reservation',async t=>{
 const h=setup(t,answer('A brief explanation.'));let reservation:any;h.ctx.runMutation=async(_fn:any,args:any)=>{reservation=args;return {status:'reserved'};};
 await repairAnswer(h.ctx,JSON.stringify(answer('word '.repeat(45))),'selected','generic',{},signal(),{used:false,sessionId:'fictional-call-budget' as any});
 assert.equal(reservation.sessionId,'fictional-call-budget');assert.equal(reservation.amountPaise,2100);assert.equal(h.calls,1);
});
