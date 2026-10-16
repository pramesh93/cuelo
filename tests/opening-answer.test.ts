import {test} from 'node:test';import assert from 'node:assert/strict';import {Agent} from '@convex-dev/agent';import {getFunctionName} from 'convex/server';import {ConvexError} from 'convex/values';
import {ask} from '../convex/openingDemo';import {encodeQuestionAudio} from '../src/audio';
const audio=encodeQuestionAudio(new Float32Array(1600).fill(.1));
const args={browserSecret:'a'.repeat(64),requestKey:'11111111-1111-1111-1111-111111111111',audio};
test('landing voice never contacts a provider when daily or paid admission is denied',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('No provider calls expected');});
 const ctx={runMutation:async()=>{throw new ConvexError('Sign in to keep using Cuelo.');}} as any;
 const result=await ask._handler(ctx,args);assert.match(result.message,/Sign in/);assert.equal(calls,0);
});
test('landing voice transcribes then displays a checked answer without storing audio or question text',async t=>{
 const mutations:Array<{name:string;args:any}>=[];
 const ctx={runMutation:async(fn:any,args:any)=>{mutations.push({name:getFunctionName(fn),args});return {remaining:2,budgetAlert:false};}} as any;
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({results:{channels:[{alternatives:[{transcript:'What is single sign-on?',confidence:.99}]}]}}),{headers:{'content-type':'application/json'}}));
 t.mock.method(Agent.prototype,'createThread',async()=>({threadId:'fictional-transient-thread'}));t.mock.method(Agent.prototype,'deleteThreadAsync',async()=>{});
 t.mock.method(Agent.prototype,'generateText',async()=>({text:JSON.stringify({status:'generic',companySpecific:false,bullets:[{text:'Single sign-on lets you access several apps with one login.',passageIds:[]}]})}));
 const result=await ask._handler(ctx,args);assert.equal(result.question,'What is single sign-on?');assert.equal(result.bullets.length,1);assert.equal(result.mode,'generic');assert.deepEqual(mutations.map(m=>m.name),['openingBudget:admit','openingBudget:release']);assert.equal(JSON.stringify(mutations).includes(result.question),false);assert.equal(mutations.some(m=>'audio' in m.args),false);
});
test('missing or inaccessible document stops before paid admission; document mode never falls back to generic',async t=>{
 let paid=0;t.mock.method(globalThis,'fetch',async()=>{assert.fail('No transcription for unavailable source');});
 const ctx={runQuery:async()=>{throw new ConvexError('This source was deleted, replaced or expired. Add or confirm it again.');},runMutation:async()=>{paid++;}} as any;
 const result=await ask._handler(ctx,{...args,sourceId:'fictional-source' as any,guestSecret:'b'.repeat(64)});assert.equal(result.mode,'document');assert.match(result.message,/deleted, replaced or expired/);assert.equal(paid,0);assert.deepEqual(result.bullets,[]);
});
