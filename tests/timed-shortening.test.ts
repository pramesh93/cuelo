import {test} from 'node:test';import assert from 'node:assert/strict';import {Agent} from '@convex-dev/agent';
import {repairAnswer} from '../convex/answerRepair';import {generatePublicAnswer} from '../convex/publicAnswerGeneration';import {checkSelectedAnswer} from '../convex/selectedAnswerPolicy';import {beginShortening,endShortening,duringShortening,ShorteningTimeout} from '../convex/shortening';
const answer=(text:string)=>({status:'generic',companySpecific:false,bullets:[{text,passageIds:[]}]});
const long=answer('word '.repeat(46));const flush=()=>new Promise<void>(resolve=>setImmediate(resolve));
function harness(t:any,generate:(args:any,index:number)=>Promise<any>){let calls=0,holds=0;const deleted:string[]=[];t.mock.method(Agent.prototype,'createThread',async()=>({threadId:`fictional-${calls}`}));t.mock.method(Agent.prototype,'deleteThreadAsync',async(_ctx:any,thread:any)=>{deleted.push(thread.threadId);});t.mock.method(Agent.prototype,'generateText',async(_ctx:any,_thread:any,args:any)=>generate(args,++calls));const ctx:any={runMutation:async()=>{holds++;return {status:'reserved'};}};return {ctx,deleted,get calls(){return calls;},get holds(){return holds;}};}
function clock(t:any){t.mock.timers.enable({apis:['Date','setTimeout']});}
test('shortening has no attempt-count cap and can succeed on the fourth attempt inside ten seconds',async t=>{
 clock(t);const h=harness(t,async(_args,i)=>{t.mock.timers.tick(2000);return {text:JSON.stringify(i<4?long:answer('A concise explanation.'))};});const raw=await repairAnswer(h.ctx,JSON.stringify(long),'selected','generic',{},new AbortController().signal,{used:true});assert.equal(raw.bullets[0].text,'A concise explanation.');assert.equal(h.calls,4);assert.equal(h.holds,4);assert.equal(h.deleted.length,4);assert.equal(raw.shorteningTimedOut,undefined);
});
test('shortening timeout stops the in-flight request at ten seconds and retains source links',async t=>{
 clock(t);let aborted=false;const h=harness(t,args=>new Promise((_resolve,reject)=>args.abortSignal.addEventListener('abort',()=>{aborted=true;reject(args.abortSignal.reason);},{once:true})));let settled=false;const pending=repairAnswer(h.ctx,JSON.stringify(long),'selected','generic',{},new AbortController().signal,{used:false}).then(value=>{settled=true;return value;});await flush();t.mock.timers.tick(9999);await flush();assert.equal(settled,false);t.mock.timers.tick(1);const raw=await pending;assert.equal(aborted,true);assert.equal(raw.shorteningTimedOut,true);assert.equal(h.calls,1);const links=[{url:'https://example.com/pricing',title:'Pricing'}];const out=checkSelectedAnswer(raw,'generic',[],links);assert.equal(out.message,'Answer too long. Refer to the source below.');assert.deepEqual(out.webSources,links);assert.deepEqual(out.bullets,[]);
});
test('ordinary short answers start no shortening timer and spend no repair hold',async t=>{
 clock(t);const h=harness(t,async()=>{throw Error('No extra request');});const budget:any={used:false};const out=await repairAnswer(h.ctx,JSON.stringify(answer('A concise explanation.')),'selected','generic',{},new AbortController().signal,budget);assert.equal(h.calls,0);assert.equal(h.holds,0);assert.equal(budget.shortening,undefined);assert.equal(out.shorteningTimedOut,undefined);
});
test('overall cancellation before ten shortening seconds is not labelled answer too long',async t=>{
 clock(t);const h=harness(t,args=>new Promise((_resolve,reject)=>args.abortSignal.addEventListener('abort',()=>reject(args.abortSignal.reason),{once:true})));const controller=new AbortController();const pending=repairAnswer(h.ctx,JSON.stringify(long),'selected','generic',{},controller.signal,{used:false});const rejected=assert.rejects(pending,/Overall request timeout/);await flush();t.mock.timers.tick(5000);controller.abort(new Error('Overall request timeout'));await rejected;assert.equal(h.calls,1);
});
test('ordinary format repair keeps its separate limit and does not use the shortening fallback',async t=>{
 clock(t);const h=harness(t,async()=>({text:'still unreadable'}));await assert.rejects(()=>repairAnswer(h.ctx,'bad JSON','selected','generic',{},new AbortController().signal,{used:false}),/Answer not found/);assert.equal(h.calls,1);
});
test('twenty seconds spent searching do not consume the ten-second shortening window',async t=>{
 clock(t);const prior=process.env.PUBLIC_WEB_SEARCH_ENABLED;process.env.PUBLIC_WEB_SEARCH_ENABLED='true';t.after(()=>{if(prior===undefined)delete process.env.PUBLIC_WEB_SEARCH_ENABLED;else process.env.PUBLIC_WEB_SEARCH_ENABLED=prior;});
 const h=harness(t,async(_args,i)=>{if(i===1)return {text:JSON.stringify({status:'search',publicQuestion:'What is ExampleCo pricing?'})};if(i===2){t.mock.timers.tick(20000);return {text:'word '.repeat(60),sources:[{sourceType:'url',url:'https://example.com/pricing',title:'Pricing'}]};}t.mock.timers.tick(9000);return {text:JSON.stringify({status:'generic',bullets:[{text:'A concise answer.',sourceIds:[0]}]})};});
 const out=await generatePublicAnswer(h.ctx,JSON.stringify({question:'What is ExampleCo pricing?'}),new AbortController().signal);assert.equal(JSON.parse(out.text).shorteningTimedOut,undefined);assert.equal(JSON.parse(out.text).bullets.length,1);assert.equal(out.webSources?.length,1);assert.equal(h.calls,3);
});
test('a slow initial compression preserves genuine search sources instead of Answer not found',async t=>{
 clock(t);const prior=process.env.PUBLIC_WEB_SEARCH_ENABLED;process.env.PUBLIC_WEB_SEARCH_ENABLED='true';t.after(()=>{if(prior===undefined)delete process.env.PUBLIC_WEB_SEARCH_ENABLED;else process.env.PUBLIC_WEB_SEARCH_ENABLED=prior;});
 const h=harness(t,async(args,i)=>{if(i===1)return {text:JSON.stringify({status:'search',publicQuestion:'What is ExampleCo pricing?'})};if(i===2)return {text:'word '.repeat(60),sources:[{sourceType:'url',url:'https://example.com/pricing',title:'Pricing'}]};return new Promise((_resolve,reject)=>args.abortSignal.addEventListener('abort',()=>reject(args.abortSignal.reason),{once:true}));});
 const pending=generatePublicAnswer(h.ctx,JSON.stringify({question:'What is ExampleCo pricing?'}),new AbortController().signal);await flush();t.mock.timers.tick(10000);const out=await pending;assert.equal(JSON.parse(out.text).shorteningTimedOut,true);assert.equal(out.webSources?.[0].url,'https://example.com/pricing');assert.equal(h.calls,3);
});
test('document shortening timeout retains owned-source identity and no long answer text',()=>{
 const out=checkSelectedAnswer({shorteningTimedOut:true},'document',[{ordinal:0,reference:'Terms',text:'Fictional source.',sourceId:'fictional-one' as any,sourceTitle:'Terms'},{ordinal:1,reference:'More',text:'More fictional text.',sourceId:'fictional-one' as any,sourceTitle:'Terms'},{ordinal:1000,reference:'Plans',text:'Other source.',sourceId:'fictional-two' as any,sourceTitle:'Plans'}]);assert.equal(out.citations.length,2);assert.equal(out.message,'Answer too long. Refer to the source below.');assert.deepEqual(out.bullets,[]);
});
test('when no source is available, timeout does not invent a link or refer to a missing source',()=>{
 const out=checkSelectedAnswer({shorteningTimedOut:true},'generic',[]);assert.equal(out.message,'Answer too long. No verified source link is available.');assert.equal(out.webSources,undefined);
});
test('time between separate shortening stages does not consume their remaining shortening time',async t=>{
 clock(t);const state:any={};beginShortening(state);t.mock.timers.tick(4000);endShortening(state);t.mock.timers.tick(20000);beginShortening(state);assert.equal(state.shorteningRemainingMs,6000);t.mock.timers.tick(5999);assert.equal(await duringShortening(state,new AbortController().signal,async()=>true),true);t.mock.timers.tick(1);await assert.rejects(()=>duringShortening(state,new AbortController().signal,async()=>true),ShorteningTimeout);endShortening(state);
});

test('deadline still returns sources and deletes the transient thread when the model ignores cancellation',async t=>{
 clock(t);const h=harness(t,async()=>new Promise(()=>{}));const pending=repairAnswer(h.ctx,JSON.stringify(long),'selected','generic',{},new AbortController().signal,{used:false});await flush();t.mock.timers.tick(10000);assert.equal((await pending).shorteningTimedOut,true);assert.equal(h.deleted.length,1);
});
test('shortening rechecks spending before every attempt rather than bypassing the budget',async t=>{
 clock(t);const h=harness(t,async()=>({text:JSON.stringify(long)}));let holds=0;h.ctx.runMutation=async()=>({status:++holds<3?'reserved':'exhausted'});await assert.rejects(()=>repairAnswer(h.ctx,JSON.stringify(long),'selected','generic',{},new AbortController().signal,{used:false}),/budget has been exhausted/);assert.equal(h.calls,2);assert.equal(holds,3);
});
test('SSO generic answer with missing hidden fields is recovered without web search',async t=>{
 const h=harness(t,async(_args,i)=>({text:JSON.stringify(i===1?{status:'generic',bullets:[{text:'SSO lets you access multiple apps with one sign-in.'}]}:answer('SSO lets you access multiple apps with one sign-in.'))}));const out=await generatePublicAnswer(h.ctx,JSON.stringify({question:'What is SSO?'}),new AbortController().signal);assert.equal(checkSelectedAnswer(JSON.parse(out.text),'generic',[],out.webSources,out.sourceUnverified).status,'generic');assert.equal(h.calls,2);assert.equal(h.holds,1);assert.equal(out.sourceUnverified,true);
});

test('the model cannot claim a shortening timeout that the server clock did not reach',async t=>{
 const {parseAnswerJSON}=await import('../convex/answerRepairPolicy');assert.equal(parseAnswerJSON(JSON.stringify({status:'unverified',bullets:[],shorteningTimedOut:true})).shorteningTimedOut,undefined);const h=harness(t,async()=>{throw Error('No repair for a refusal');});const raw=await repairAnswer(h.ctx,JSON.stringify({status:'unverified',bullets:[],shorteningTimedOut:true}),'selected','generic',{},new AbortController().signal,{used:false});assert.equal(raw.shorteningTimedOut,undefined);assert.equal(h.calls,0);
});
test('unsafe compression keeps trying within the time window and never displays a dropped document condition',async t=>{
 clock(t);const original={status:'supported',bullets:[{text:'SSO is available only if annual billing is enabled. '+'extra '.repeat(38),passageIds:[0]}]};const h=harness(t,async()=>{t.mock.timers.tick(2000);return {text:JSON.stringify({status:'supported',bullets:[{text:'SSO is available.',passageIds:[0]}]})};});const raw=await repairAnswer(h.ctx,JSON.stringify(original),'selected','document',{},new AbortController().signal,{used:false});assert.equal(raw.shorteningTimedOut,true);assert.deepEqual(raw.bullets,[]);assert.equal(h.calls,5);
});
