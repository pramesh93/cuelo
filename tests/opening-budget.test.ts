import {test} from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {admit,release,status} from '../convex/openingBudget';
import {openingDay,openingReset} from '../convex/openingPolicy';
function fixture(){let serial=0;let identity:string|null=null;const tables=new Map<string,Map<string,any>>();const table=(name:string)=>{if(!tables.has(name))tables.set(name,new Map());return tables.get(name)!;};const ctx={auth:{getUserIdentity:async()=>identity?{subject:identity}:null},db:{query:(name:string)=>({withIndex:(_index:string,select:any)=>{const rules:Array<(r:any)=>boolean>=[];const q:any={eq:(field:string,value:any)=>{rules.push(r=>r[field]===value);return q;},lte:(field:string,value:any)=>{rules.push(r=>r[field]<=value);return q;}};select(q);return {take:async(n:number)=>[...table(name).values()].filter(r=>rules.every(f=>f(r))).slice(0,n)};}}),insert:async(name:string,row:any)=>{const id=`${name}-${++serial}`;table(name).set(id,{_id:id,...row});return id;},patch:async(id:string,values:any)=>{for(const t of tables.values())if(t.has(id))Object.assign(t.get(id),values);},delete:async(id:string)=>{for(const t of tables.values())t.delete(id);}}};return {ctx:ctx as any,table,setIdentity:(value:string|null)=>{identity=value;}};}
const browserSecret='a'.repeat(64);
const settings={V1_PAID_TESTING_ENABLED:'true',OPENING_DEMO_TESTING_ENABLED:'true',EVALUATION_TESTING_ENABLED:'false',SPEECH_TESTING_ENABLED:'false',OPENAI_API_KEY:'fake',DEEPGRAM_API_KEY:'fake',EVALUATION_ATTEMPT_LIMIT:'14'};
async function enabled(work:()=>Promise<void>){const prior=Object.fromEntries(Object.keys(settings).map(key=>[key,process.env[key]]));Object.assign(process.env,settings);try{await work();}finally{for(const [key,value] of Object.entries(prior)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}}
test('three submitted questions share one daily browser limit across visits; a fourth writes nothing',async()=>enabled(async()=>{
 const f=fixture();for(let i=0;i<3;i++){const requestKey=randomUUID();assert.equal((await admit._handler(f.ctx,{browserSecret,requestKey})).remaining,2-i);await release._handler(f.ctx,{browserSecret,requestKey});}
 const before=JSON.stringify([...f.table('evaluationUsage').values()]);await assert.rejects(()=>admit._handler(f.ctx,{browserSecret,requestKey:randomUUID()}),/Sign in/);assert.equal(JSON.stringify([...f.table('evaluationUsage').values()]),before);
 assert.equal((await status._handler(f.ctx,{browserSecret,day:'fake-client-day'})).remaining,0);assert.equal(f.table('spendingReservations').size,3);
 const row=[...f.table('openingUsage').values()][0];row.day='2000-01-01';assert.equal((await status._handler(f.ctx,{browserSecret,day:'anything'})).remaining,3);const requestKey=randomUUID();assert.equal((await admit._handler(f.ctx,{browserSecret,requestKey})).remaining,2);
}));
test('disabled testing, exhausted global budgets and signed-in accounts do not consume guest questions',async()=>enabled(async()=>{
 const f=fixture();process.env.V1_PAID_TESTING_ENABLED='false';await assert.rejects(()=>admit._handler(f.ctx,{browserSecret,requestKey:randomUUID()}),/paused/);assert.equal(f.table('openingUsage').size,0);assert.equal(f.table('spendingReservations').size,0);
 process.env.V1_PAID_TESTING_ENABLED='true';f.table('evaluationUsage').set('usage',{_id:'usage',scope:'milestone1',count:14,reservedUsd:1.4});await assert.rejects(()=>admit._handler(f.ctx,{browserSecret,requestKey:randomUUID()}),/allowance/);assert.equal(f.table('openingUsage').size,0);
 f.setIdentity('fictional-user|session');await assert.rejects(()=>admit._handler(f.ctx,{browserSecret,requestKey:randomUUID()}),/signed in/);
}));
test('a second tab cannot start alongside the first and old completions cannot release a newer request',async()=>enabled(async()=>{
 const f=fixture(),first=randomUUID(),second=randomUUID();await admit._handler(f.ctx,{browserSecret,requestKey:first});await assert.rejects(()=>admit._handler(f.ctx,{browserSecret,requestKey:second}),/another tab/);
 await release._handler(f.ctx,{browserSecret,requestKey:first});await admit._handler(f.ctx,{browserSecret,requestKey:second});await release._handler(f.ctx,{browserSecret,requestKey:first});assert.equal([...f.table('openingUsage').values()][0].activeKey,second);
 await release._handler(f.ctx,{browserSecret,requestKey:second});await assert.rejects(()=>admit._handler(f.ctx,{browserSecret,requestKey:first}),/already submitted/);
}));
test('daily reset is midnight India time, independent of browser timezone',()=>{
 const before=Date.parse('2026-10-11T18:29:59Z'),after=before+1000;assert.equal(openingDay(before),'2026-10-11');assert.equal(openingDay(after),'2026-10-12');assert.equal(openingReset(before),after);
});

test('landing demo refuses spending above the production allocation without consuming a question',async()=>enabled(async()=>{
 const previous=process.env.CONVEX_CLOUD_URL;process.env.CONVEX_CLOUD_URL='https://deafening-frog-846.convex.cloud';
 try{const f=fixture();f.table('spendingMonths').set('ledger',{_id:'ledger',month:new Date().toISOString().slice(0,7),reservedPaise:199000,reservations:1});
 await assert.rejects(()=>admit._handler(f.ctx,{browserSecret,requestKey:randomUUID()}),/budget/);assert.equal(f.table('openingUsage').size,0);assert.equal(f.table('spendingReservations').size,0);}
 finally{if(previous===undefined)delete process.env.CONVEX_CLOUD_URL;else process.env.CONVEX_CLOUD_URL=previous;}
}));
test('explicit landing retest allowance preserves historical counts and stops after three additions',async()=>enabled(async()=>{
 const names=['OPENING_DEMO_MAX_ANSWERS','OPENING_DEMO_MAX_TRANSCRIPTIONS'];const previous=names.map(n=>process.env[n]);
 process.env.OPENING_DEMO_MAX_ANSWERS='16';process.env.OPENING_DEMO_MAX_TRANSCRIPTIONS='13';
 try{const f=fixture();f.table('evaluationUsage').set('evaluation',{_id:'evaluation',scope:'milestone1',count:13,reservedUsd:1});f.table('speechUsage').set('speech',{_id:'speech',scope:'mic-evaluation',count:10,reservedUsd:.1,activeUntil:0});
 for(let i=0;i<3;i++){const requestKey=randomUUID();await admit._handler(f.ctx,{browserSecret,requestKey});await release._handler(f.ctx,{browserSecret,requestKey});}
 assert.equal(f.table('evaluationUsage').get('evaluation').count,16);assert.equal(f.table('speechUsage').get('speech').count,13);
 await assert.rejects(()=>admit._handler(f.ctx,{browserSecret:'b'.repeat(64),requestKey:randomUUID()}),/allowance/);assert.equal(f.table('spendingReservations').size,3);
 }finally{names.forEach((n,i)=>{if(previous[i]===undefined)delete process.env[n];else process.env[n]=previous[i];});}
}));

test('development global test cap has its own message and stops before admission or spending',async()=>enabled(async()=>{
 const previous=process.env.CONVEX_CLOUD_URL;process.env.CONVEX_CLOUD_URL='https://calculating-gecko-263.convex.cloud';
 try{const f=fixture();f.table('evaluationUsage').set('usage',{_id:'usage',scope:'milestone1',count:100,reservedUsd:1});await assert.rejects(()=>admit._handler(f.ctx,{browserSecret,requestKey:randomUUID()}),/development testing allowance is used up/);assert.equal(f.table('openingUsage').size,0);assert.equal(f.table('spendingReservations').size,0);}
 finally{if(previous===undefined)delete process.env.CONVEX_CLOUD_URL;else process.env.CONVEX_CLOUD_URL=previous;}
}));

test('landing distinguishes personal exhaustion from a shared test cap even when both limits are reached',async t=>enabled(async()=>{
 const {ask}=await import('../convex/openingDemo');const {encodeQuestionAudio}=await import('../src/audio');const {WEBSITE_TEST_LIMIT}=await import('../convex/answerErrors');
 const previous=process.env.CONVEX_CLOUD_URL;process.env.CONVEX_CLOUD_URL='https://calculating-gecko-263.convex.cloud';
 let providers=0;t.mock.method(globalThis,'fetch',async()=>{providers++;throw Error('Blocked questions must not reach a provider');});
 try{for(const personalUsed of [2,3]){
  const f=fixture();for(let i=0;i<personalUsed;i++){const requestKey=randomUUID();await admit._handler(f.ctx,{browserSecret,requestKey});await release._handler(f.ctx,{browserSecret,requestKey});}
  [...f.table('evaluationUsage').values()][0].count=100;
  const before=JSON.stringify([...f.table('spendingReservations').values()]);
  const ctx:any={runMutation:async(_fn:any,args:any)=>admit._handler(f.ctx,args)};
  const result=await ask._handler(ctx,{browserSecret,requestKey:randomUUID(),audio:encodeQuestionAudio(new Float32Array(1600).fill(.1))});
  assert.equal(result.message,personalUsed===3?'Sign in to keep using Cuelo.':WEBSITE_TEST_LIMIT);
  assert.deepEqual(result.bullets,[]);assert.equal(JSON.stringify([...f.table('spendingReservations').values()]),before);
  assert.equal((await status._handler(f.ctx,{browserSecret,day:'ignored'})).remaining,3-personalUsed);
 }
 assert.equal(providers,0);
 }finally{if(previous===undefined)delete process.env.CONVEX_CLOUD_URL;else process.env.CONVEX_CLOUD_URL=previous;}
}));
