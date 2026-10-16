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
