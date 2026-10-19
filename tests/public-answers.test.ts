import {test} from 'node:test';import assert from 'node:assert/strict';import {Agent} from '@convex-dev/agent';import {getFunctionName} from 'convex/server';
import {generatePublicAnswer} from '../convex/publicAnswerGeneration';import {checkSelectedAnswer} from '../convex/selectedAnswerPolicy';import {checkedWebSources,safePublicURL,searchQuestion,providerWebSources} from '../convex/publicAnswerPolicy';
function harness(t:any,enabled=true){const calls:any[]=[],mutations:any[]=[],deleted:string[]=[];let count=0;const prior=process.env.PUBLIC_WEB_SEARCH_ENABLED;process.env.PUBLIC_WEB_SEARCH_ENABLED=String(enabled);t.after(()=>{if(prior===undefined)delete process.env.PUBLIC_WEB_SEARCH_ENABLED;else process.env.PUBLIC_WEB_SEARCH_ENABLED=prior;});t.mock.method(Agent.prototype,'createThread',async()=>({threadId:`fake-${++count}`}));t.mock.method(Agent.prototype,'deleteThreadAsync',async(_ctx:any,args:any)=>{deleted.push(args.threadId);});const ctx={runMutation:async(fn:any,args:any)=>{mutations.push({name:getFunctionName(fn),args});return {status:'reserved',alert:false};}} as any;return {ctx,calls,mutations,deleted};}
const question='What is ExampleCo pricing?',url='https://example.com/pricing';
const routing={text:JSON.stringify({status:'search',publicQuestion:question})};
const searched={text:JSON.stringify({status:'generic',companySpecific:false,bullets:[{text:'The fictional plan costs $10 monthly.',passageIds:[],sourceUrls:[url],sourceIds:[0]}]}),sources:[{sourceType:'url',id:'source1',url,title:'ExampleCo pricing'}]};
test('public company pricing searches with only a resolved public question, bounded tools and a prior budget hold',async t=>{
 const h=harness(t);t.mock.method(Agent.prototype,'generateText',async(...args:any[])=>{h.calls.push(args[2]);return h.calls.length===1?routing:searched;});
 const out=await generatePublicAnswer(h.ctx,JSON.stringify({mode:'generic',question,conversation:'Private customer meeting detail'}),new AbortController().signal);
 assert.equal(h.calls[1].prompt,question);assert.equal(JSON.stringify(h.calls[1]).includes('Private customer'),false);assert.equal(h.calls[1].maxRetries,0);assert.equal(h.calls[1].providerOptions.openai.maxToolCalls,2);assert.equal(h.calls[1].providerOptions.openai.store,false);assert.equal(h.mutations[0].name,'spending:reserve');assert.equal(h.mutations[0].args.amountPaise,5000);assert.equal(h.deleted.length,3);
 const checked=checkSelectedAnswer(JSON.parse(out.text),'generic',[],out.webSources);assert.equal(checked.status,'generic');assert.equal(checked.webSources?.[0].url,url);assert.equal(checked.bullets.length,1);
});
test('stable knowledge avoids web search and additional search spending',async t=>{
 const h=harness(t);t.mock.method(Agent.prototype,'generateText',async(...args:any[])=>{h.calls.push(args[2]);return {text:JSON.stringify({status:'generic',companySpecific:false,bullets:[{text:'SSO uses one sign-in across apps.',passageIds:[]}]})};});await generatePublicAnswer(h.ctx,JSON.stringify({mode:'generic',question:'What is SSO?'}),new AbortController().signal);assert.equal(h.calls.length,1);assert.equal(h.mutations.length,0);
});
test('disabled search and exhausted budget never issue a search or return remembered pricing',async t=>{
 const h=harness(t,false);let calls=0;t.mock.method(Agent.prototype,'generateText',async()=>{calls++;return routing;});await assert.rejects(()=>generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal),/contact the Cuelo team/);assert.equal(calls,1);assert.equal(h.mutations.length,0);process.env.PUBLIC_WEB_SEARCH_ENABLED='true';h.ctx.runMutation=async()=>({status:'exhausted'});await assert.rejects(()=>generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal),/budget has been exhausted/);assert.equal(calls,2);
});
test('invented citations and unsafe source URLs cannot become public evidence',async t=>{
 const h=harness(t);let calls=0;t.mock.method(Agent.prototype,'generateText',async()=>{calls++;if(calls===1)return routing;if(calls===2)return {...searched,sources:[{sourceType:'url',url:'https://example.com/unrelated',title:'Other'}]};return {text:JSON.stringify({status:'generic',bullets:[{text:'Fictional answer.',sourceIds:[99]}]})};});const out=await generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal);assert.equal(JSON.parse(out.text).status,'generic');assert.equal(out.sourceUnverified,true);assert.deepEqual(out.webSources,[]);
 for(const url of ['javascript:alert(1)','http://127.0.0.1/x','http://[::1]/','http://host.local/x','https://name:password@example.com/','data:text/html,hi'])assert.equal(safePublicURL(url),null);assert.equal(checkedWebSources([{url:'https://example.com/',title:'Safe'},{url:'https://example.com/',title:'Safe'}]).length,1);
});
test('private lookup requests and cancellation cannot reach public search',async t=>{
 const h=harness(t);let calls=0;t.mock.method(Agent.prototype,'generateText',async()=>{calls++;return {text:JSON.stringify({status:'unverified',companySpecific:false,bullets:[]})};});await generatePublicAnswer(h.ctx,JSON.stringify({question:'What is our private contract pricing?'}),new AbortController().signal);assert.equal(h.mutations.length,0);
 for(const text of ['Find account user@example.com','bearer secret-token','account 123456789012'])assert.throws(()=>searchQuestion(text),/private/);
 const abort=new AbortController();abort.abort(new Error('Cancelled'));await assert.rejects(()=>generatePublicAnswer(h.ctx,JSON.stringify({question}),abort.signal),/Cancelled/);assert.equal(h.mutations.length,0);
});
test('document mode ignores web citations and retains source-only grounding and word limit',()=>{
 const raw={status:'supported',bullets:[{text:'Email support is included.',passageIds:[0]}]},sources=[{url,title:'Public'}];const checked=checkSelectedAnswer(raw,'document',[{ordinal:0,reference:'Support',text:'Email support is included.'}],sources);assert.equal(checked.status,'supported');assert.equal(checked.webSources,undefined);assert.equal(checkSelectedAnswer({...raw,bullets:[{text:'word '.repeat(41),passageIds:[0]}]},'document',[{ordinal:0,reference:'Support',text:'word '.repeat(41)}]).status,'unverified');
});
test('installed OpenAI adapter sends Responses web-search limits and extracts provider citation metadata without a real request',async()=>{
 const {createOpenAI,openai}=await import('@ai-sdk/openai');const {generateText}=await import('ai');let body:any;
 for(const inline of [true,false]){
 const provider=createOpenAI({apiKey:'fictional-key',baseURL:'https://example.invalid/v1',fetch:async(_url:any,init:any)=>{body=JSON.parse(init.body);return new Response(JSON.stringify({id:'resp_fictional',object:'response',created_at:1,model:'gpt-4.1',status:'completed',output:[{id:'ws_fictional',type:'web_search_call',status:'completed',action:{type:'search',query:question,sources:[{type:'url',url}]}},{id:'msg_fictional',type:'message',status:'completed',role:'assistant',content:[{type:'output_text',text:searched.text,annotations:inline?[{type:'url_citation',start_index:0,end_index:10,url,title:'ExampleCo pricing'}]:[]}]}],usage:{input_tokens:50,output_tokens:30,total_tokens:80,input_tokens_details:{cached_tokens:0},output_tokens_details:{reasoning_tokens:0}}}),{headers:{'content-type':'application/json'}});}});
 const result=await generateText({model:provider.responses('gpt-4.1'),tools:{web_search:openai.tools.webSearch({externalWebAccess:true,searchContextSize:'low'})},prompt:question,toolChoice:'required',maxRetries:0,maxOutputTokens:500,providerOptions:{openai:{store:false,maxToolCalls:2,includeWebSearchSources:true}}});
 assert.equal(body.model,'gpt-4.1');assert.equal(body.max_tool_calls,2);assert.equal(body.store,false);assert.equal(body.tools[0].type,'web_search');assert.equal(body.tools[0].external_web_access,true);assert.equal(result.sources.length,inline?1:0);assert.equal(providerWebSources(result)[0].url,url);assert.equal(JSON.parse(result.text).bullets.length,1);
 }
});
test('search failure never falls back to remembered prices and transient threads are deleted',async t=>{
 const h=harness(t);let calls=0;t.mock.method(Agent.prototype,'generateText',async()=>{if(++calls===1)return routing;throw Error('Simulated search unavailable');});await assert.rejects(()=>generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal),/Simulated search/);assert.equal(h.deleted.length,2);
});
test('public search cannot return an answer after cancellation during search',async t=>{
 const h=harness(t),abort=new AbortController();let calls=0;t.mock.method(Agent.prototype,'generateText',async()=>{if(++calls===1)return routing;abort.abort(new Error('Cancelled'));return searched;});await assert.rejects(()=>generatePublicAnswer(h.ctx,JSON.stringify({question}),abort.signal),/Cancelled/);assert.equal(h.deleted.length,2);
});
test('genuine provider search-result URLs support an answer even when inline annotations are absent',async t=>{
 const h=harness(t);let calls=0;
 t.mock.method(Agent.prototype,'generateText',async()=>++calls===1?routing:{...searched,sources:[],toolResults:[{toolName:'web_search',providerExecuted:true,output:{sources:[{type:'url',url}]}}]});
 const out=await generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal);
 assert.equal(JSON.parse(out.text).status,'generic');assert.equal(out.webSources?.[0].url,url);
});
test('URLs from an unrelated tool cannot authenticate an invented citation',async t=>{
 const h=harness(t);let calls=0;
 t.mock.method(Agent.prototype,'generateText',async()=>++calls===1?routing:{...searched,sources:[],toolResults:[{toolName:'other_tool',providerExecuted:true,output:{sources:[{type:'url',url}]}}]});
 const out=await generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal);assert.equal(JSON.parse(out.text).status,'generic');assert.equal(out.sourceUnverified,true);assert.deepEqual(out.webSources,[]);
});
test('search-step sources and ordinary URL normalization preserve genuine citations',async t=>{
 const h=harness(t);let calls=0;const raw={status:'generic',companySpecific:false,bullets:[{text:'Fictional public answer.',passageIds:[],sourceUrls:['https://example.com'],sourceIds:[0]}]};
 t.mock.method(Agent.prototype,'generateText',async()=>++calls===1?routing:{text:JSON.stringify(raw),sources:[],steps:[{toolResults:[{toolName:'web_search',providerExecuted:true,output:{sources:[{type:'url',url:'https://example.com/'}]}}]}]});
 const out=await generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal);assert.equal(JSON.parse(out.text).status,'generic');assert.equal(out.webSources?.[0].url,'https://example.com/');
});
test('native cited search text is shortened separately while source links are assigned only from provider IDs',async t=>{
 const h=harness(t);t.mock.method(Agent.prototype,'generateText',async(...args:any[])=>{h.calls.push(args[2]);if(h.calls.length===1)return routing;if(h.calls.length===2)return {text:'The fictional plan costs $10 monthly, according to its official pricing page.',sources:searched.sources};return {text:JSON.stringify({status:'generic',bullets:[{text:'The fictional plan costs $10 monthly.',sourceIds:[0]}]})};});
 const out=await generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal);assert.equal(h.calls.length,3);assert.equal(h.calls[1].toolChoice,'required');assert.equal(h.calls[2].toolChoice,undefined);assert.equal(h.calls[2].maxRetries,0);const input=JSON.parse(h.calls[2].prompt);assert.equal(input.sources[0].id,0);assert.equal(input.sources[0].url,url);assert.ok(input.answer.includes('official pricing page'));assert.equal(out.webSources?.[0].url,url);const raw=JSON.parse(out.text);assert.deepEqual(raw.bullets[0].sourceUrls,[url]);assert.equal(checkSelectedAnswer(raw,'generic',[],out.webSources).status,'generic');assert.equal(h.deleted.length,3);
});
test('formatter refusal does not invent an answer even when the search returned source metadata',async t=>{
 const h=harness(t);let calls=0;t.mock.method(Agent.prototype,'generateText',async()=>{calls++;return calls===1?routing:calls===2?searched:{text:JSON.stringify({status:'unverified',bullets:[]})};});const out=await generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal);assert.equal(JSON.parse(out.text).status,'unverified');assert.equal(out.webSources,undefined);assert.equal(h.deleted.length,3);
});


test('overlong public formatting receives exactly one compression and preserves actual source links',async t=>{
 const h=harness(t);t.mock.method(Agent.prototype,'generateText',async(...args:any[])=>{h.calls.push(args[2]);switch(h.calls.length){case 1:return routing;case 2:return {text:'Fictional public pricing.',sources:searched.sources};case 3:return {text:JSON.stringify({status:'generic',bullets:[{text:'word '.repeat(46),sourceIds:[0]}]})};default:return {text:JSON.stringify({status:'generic',bullets:[{text:'A short fictional public answer.',sourceIds:[0]}]})};}});
 const out=await generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal);assert.equal(h.calls.length,4);assert.equal(h.mutations.length,2);assert.equal(h.mutations[1].args.amountPaise,2100);assert.equal(out.sourceUnverified,false);assert.equal(out.webSources?.[0].url,url);assert.equal(checkSelectedAnswer(JSON.parse(out.text),'generic',[],out.webSources,out.sourceUnverified).status,'generic');assert.equal(h.deleted.length,4);
});
test('missing provider metadata keeps an available public answer but never fabricates a source',async t=>{
 const h=harness(t);let calls=0;t.mock.method(Agent.prototype,'generateText',async()=>++calls===1?routing:calls===2?{text:'A fictional public explanation.',sources:[]}:{text:JSON.stringify({status:'generic',bullets:[{text:'A fictional public explanation.',sourceIds:[]}]})});
 const out=await generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal);assert.equal(JSON.parse(out.text).bullets.length,1);assert.equal(out.sourceUnverified,true);assert.deepEqual(out.webSources,[]);assert.equal(h.deleted.length,3);
});
test('one bad source reference does not discard independently linked public bullets',async t=>{
 const h=harness(t);let calls=0;t.mock.method(Agent.prototype,'generateText',async()=>++calls===1?routing:calls===2?searched:{text:JSON.stringify({status:'generic',bullets:[{text:'A linked fictional fact.',sourceIds:[0]},{text:'Another fictional point.',sourceIds:[99]}]})});
 const out=await generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal);assert.equal(JSON.parse(out.text).bullets.length,2);assert.equal(out.webSources?.[0].url,url);assert.equal(out.sourceUnverified,true);assert.equal(JSON.parse(out.text).bullets[1].sourceUrls.length,0);
});
test('conflicting public facts return the agreed explanation and real source links',async t=>{
 const h=harness(t);let calls=0;t.mock.method(Agent.prototype,'generateText',async()=>++calls===1?routing:calls===2?searched:{text:JSON.stringify({status:'conflict',bullets:[]})});
 const out=await generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal);const checked=checkSelectedAnswer(JSON.parse(out.text),'generic',[],out.webSources);assert.equal(checked.status,'conflict');assert.match(checked.message,/different prices/);assert.equal(checked.webSources?.[0].url,url);assert.equal(checked.bullets.length,0);
});
test('empty search output does not produce a made-up public answer or needless formatting request',async t=>{
 const h=harness(t);let calls=0;t.mock.method(Agent.prototype,'generateText',async()=>++calls===1?routing:{text:'',sources:[]});const out=await generatePublicAnswer(h.ctx,JSON.stringify({question}),new AbortController().signal);assert.equal(JSON.parse(out.text).status,'unverified');assert.equal(calls,2);
});
test('source titles may fall back to host names, but unsafe URLs and other-tool links never become sources',()=>{
 assert.deepEqual(checkedWebSources([{url,title:''}]),[{url,title:'example.com'}]);assert.deepEqual(providerWebSources({steps:[{sources:[{sourceType:'url',url,title:'Pricing'}]}]}),[{url,title:'Pricing'}]);assert.equal(providerWebSources({toolResults:[{toolName:'other',providerExecuted:true,output:{sources:[{type:'url',url}]}}]}).length,0);
});

test('live generic answers attach the server-selected call to search reservations without sending it to search',async t=>{
 const {generateSelectedAnswer}=await import('../convex/answerGeneration');const h=harness(t),sessionId='fictional-call-budget' as any;
 t.mock.method(Agent.prototype,'generateText',async(...args:any[])=>{h.calls.push(args[2]);return h.calls.length===1?routing:searched;});
 await generateSelectedAnswer(h.ctx,JSON.stringify({mode:'generic',question}),new AbortController().signal,true,sessionId);
 assert.equal(h.mutations[0].args.sessionId,sessionId);assert.equal(h.mutations[0].args.amountPaise,5000);assert.equal(h.calls[1].prompt.includes(sessionId),false);
});
