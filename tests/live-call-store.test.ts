import {test} from 'node:test';import assert from 'node:assert/strict';
import {start,append,change,prepare,check,credentialAdmission,heartbeat,queuedPrepare,queuedComplete,context,cleanup} from '../convex/liveCalls';
function fixture(){let subject:string|null='fictional-user|fictional-session';let serial=0;const tables=new Map<string,Map<string,any>>();const table=(name:string)=>{if(!tables.has(name))tables.set(name,new Map());return tables.get(name)!;};table('testerAccess').set('invite',{_id:'invite',userId:'fictional-user',enabled:true});
 const ctx:any={auth:{getUserIdentity:async()=>subject?{subject}:null},db:{get:async(id:string)=>{for(const t of tables.values())if(t.has(id))return {...t.get(id)};return null;},query:(name:string)=>{const select=(callback:any)=>{const rules:Array<(r:any)=>boolean>=[];const q:any={eq:(f:string,v:any)=>{rules.push(r=>r[f]===v);return q;},lte:(f:string,v:any)=>{rules.push(r=>r[f]<=v);return q;},search:()=>q};callback(q);let descending=false;const result={order:(direction:string)=>{descending=direction==='desc';return result;},take:async(n:number)=>[...table(name).values()].filter(r=>rules.every(rule=>rule(r))).sort((a,b)=>descending?b.sequence-a.sequence:0).slice(0,n).map(r=>({...r}))};return result;};return {withIndex:(_name:string,callback:any)=>select(callback),withSearchIndex:(_name:string,callback:any)=>select(callback)};},insert:async(name:string,row:any)=>{const id=`${name}-${++serial}`;table(name).set(id,{_id:id,_creationTime:Date.now(),...row});return id;},patch:async(id:string,values:any)=>{for(const t of tables.values())if(t.has(id))Object.assign(t.get(id),values);},delete:async(id:string)=>{for(const t of tables.values())t.delete(id);}}};return {ctx,table,setSubject:(s:string|null)=>subject=s};}
const settings={LIVE_CALL_TESTING_ENABLED:'true',V1_PAID_TESTING_ENABLED:'true',DEEPGRAM_API_KEY:'fake',OPENAI_API_KEY:'fake',LIVE_CALL_TEST_SESSION_LIMIT:'2',LIVE_CALL_MAX_CONNECTIONS:'2',LIVE_CALL_MAX_DETECTIONS:'12',LIVE_CALL_MAX_ANSWERS:'4',LIVE_CALL_RESERVE_PAISE:'10000'};
async function configured(run:()=>Promise<void>){const old={...process.env};Object.assign(process.env,settings);try{await run();}finally{for(const key of Object.keys(settings)){if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}}}
test('disabled or uninvited live admission writes no sessions, usage or spending',async()=>{await configured(async()=>{const f=fixture();delete process.env.LIVE_CALL_TESTING_ENABLED;await assert.rejects(()=>start._handler(f.ctx,{mode:'generic'}),/not enabled/);assert.equal(f.table('spendingReservations').size,0);process.env.LIVE_CALL_TESTING_ENABLED='true';f.table('testerAccess').get('invite').enabled=false;await assert.rejects(()=>start._handler(f.ctx,{mode:'generic'}),/invited/);f.setSubject(null);await assert.rejects(()=>start._handler(f.ctx,{mode:'generic'}),/Sign in/);assert.equal(f.table('liveCalls').size,0);});});
test('session admission reserves once, rejects concurrency/source smuggling, pause preserves deadline, Stop deletes text',async()=>{await configured(async()=>{const f=fixture();await assert.rejects(()=>start._handler(f.ctx,{mode:'generic',sourceId:'foreign-source' as any}),/must not/);const session=await start._handler(f.ctx,{mode:'generic'});const row=f.table('liveCalls').get(session.sessionId);assert.equal(f.table('spendingReservations').size,1);await assert.rejects(()=>start._handler(f.ctx,{mode:'generic'}),/Another tester/);const grant=await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});assert.equal(grant.deadline,session.deadline);
 const rep=await append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'salesperson',text:'Does it support single sign-on?'});assert.equal(await prepare._handler(f.ctx,{sessionId:session.sessionId,utteranceId:rep.utteranceId}),null);
 const customer=await append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'customer',text:'How does single sign-on work?'});assert.ok(await prepare._handler(f.ctx,{sessionId:session.sessionId,utteranceId:customer.utteranceId}));assert.equal(await prepare._handler(f.ctx,{sessionId:session.sessionId,utteranceId:customer.utteranceId}),null);
 await change._handler(f.ctx,{sessionId:session.sessionId,state:'paused'});assert.equal(row.deadline,session.deadline);assert.equal(await check._handler(f.ctx,{sessionId:session.sessionId,revision:customer.revision}),false);await change._handler(f.ctx,{sessionId:session.sessionId,state:'active'});await assert.rejects(()=>append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'customer',text:'old audio'}),/Old audio/);await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});assert.equal(f.table('callText').size,0);assert.equal(f.table('liveCalls').size,0);assert.equal(f.table('spendingReservations').size,1);});});
test('other accounts, newer questions, revoked access and expired deadlines invalidate pending work',async()=>{await configured(async()=>{const f=fixture();const session=await start._handler(f.ctx,{mode:'generic'});const grant=await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});const first=await append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'customer',text:'First question?'});assert.equal(await check._handler(f.ctx,{sessionId:session.sessionId,revision:first.revision}),true);await append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'customer',text:'New question?'});assert.equal(await check._handler(f.ctx,{sessionId:session.sessionId,revision:first.revision}),false);f.setSubject('another-user|another-session');await assert.rejects(()=>change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'}),/unavailable/);f.setSubject('fictional-user|fictional-session');f.table('testerAccess').get('invite').enabled=false;assert.equal(await check._handler(f.ctx,{sessionId:session.sessionId}),false);await assert.rejects(()=>heartbeat._handler(f.ctx,{sessionId:session.sessionId}),/invited/);f.table('testerAccess').get('invite').enabled=true;f.table('liveCalls').get(session.sessionId).deadline=Date.now()-1;assert.equal(await check._handler(f.ctx,{sessionId:session.sessionId}),false);await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});assert.equal(f.table('callText').size,0);});});

test('queued questions survive later speech, reserve once across Pause, and clear at Stop',async()=>{await configured(async()=>{
 const f=fixture(),session=await start._handler(f.ctx,{mode:'generic'}),grant=await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});
 const first=await append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'customer',text:'What is the price?'});
 const later=await append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'customer',text:'We have a large team.'});
 const args={sessionId:session.sessionId,utteranceId:first.utteranceId,generation:grant.generation};
 assert.ok(await queuedPrepare._handler(f.ctx,{...args,phase:'detect'}));
 assert.equal(await queuedComplete._handler(f.ctx,{...args,question:'What is the price?'}),true);
 assert.ok(await queuedPrepare._handler(f.ctx,{...args,phase:'answer'}));assert.equal(f.table('liveCalls').get(session.sessionId).answers,1);
 await assert.rejects(()=>queuedPrepare._handler(f.ctx,{...args,phase:'answer'}),/already/);
 const second={...args,utteranceId:later.utteranceId};assert.ok(await queuedPrepare._handler(f.ctx,{...second,phase:'detect'}));await queuedComplete._handler(f.ctx,{...second,skipped:true});assert.equal((await queuedPrepare._handler(f.ctx,{...second,phase:'detect'}))?.skipped,true);
 await change._handler(f.ctx,{sessionId:session.sessionId,state:'paused'});assert.equal(await check._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation}),false);
 await change._handler(f.ctx,{sessionId:session.sessionId,state:'active'});const resumed=await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});
 assert.ok(await queuedPrepare._handler(f.ctx,{...args,generation:resumed.generation,phase:'answer'}));assert.equal(f.table('liveCalls').get(session.sessionId).answers,1);
 assert.equal(await queuedComplete._handler(f.ctx,{...args,answered:true}),false);
 const outcome={question:'What is the price?',mode:'generic' as const,status:'generic' as const,bullets:['The example costs $29.'],message:'',citations:[],source:null,elapsedMs:10,budgetAlert:false};
 assert.equal(await queuedComplete._handler(f.ctx,{...args,generation:resumed.generation,answered:true,answerResult:outcome}),true);
 assert.deepEqual((await queuedPrepare._handler(f.ctx,{...args,generation:resumed.generation,phase:'answer'}))?.answerResult,outcome);
 assert.equal(f.table('liveCalls').get(session.sessionId).answers,1);

 await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});assert.equal(f.table('callText').size,0);
});});

test('document admission and evidence reject missing, expired and other-account sources without spending',async()=>{await configured(async()=>{
 for(const state of ['missing','expired','foreign'] as const){
  const f=fixture();
  if(state!=='missing')f.table('sources').set('source',{_id:'source',ownerKey:state==='foreign'?'user:another-user':'user:fictional-user',saved:true,expiresAt:state==='expired'?Date.now()-1:null});
  await assert.rejects(()=>start._handler(f.ctx,{mode:'document',sourceId:'source' as any}),/changed or expired/);
  assert.equal(f.table('spendingReservations').size,0);assert.equal(f.table('liveCalls').size,0);
 }
});});

test('live evidence stays source-owned; replacement/deletion produces an explicit source error',async()=>{await configured(async()=>{
 const f=fixture(),session=await start._handler(f.ctx,{mode:'generic'});
 const row=f.table('liveCalls').get(session.sessionId);Object.assign(row,{mode:'document',sourceId:'source',sourceOwnerKey:'user:fictional-user'});
 f.table('sources').set('source',{_id:'source',ownerKey:'user:fictional-user',title:'Fictional FAQ',kind:'text',url:null,pageCount:null,passageCount:1,saved:true,expiresAt:null});
 f.table('sourcePassages').set('p',{_id:'p',sourceId:'source',ordinal:0,reference:'Business plan',text:'Business includes Salesforce integration.'});
 const evidence=await context._handler(f.ctx,{sessionId:session.sessionId,question:'Salesforce?'});
 assert.equal(evidence.passages[0].reference,'Business plan');assert.equal(evidence.source?.title,'Fictional FAQ');
 f.setSubject('another-user|session');
 await assert.rejects(()=>context._handler(f.ctx,{sessionId:session.sessionId,question:'Salesforce?'}),/unavailable/);
 f.setSubject('fictional-user|fictional-session');f.table('sources').get('source').ownerKey='user:another-user';
 await assert.rejects(()=>context._handler(f.ctx,{sessionId:session.sessionId,question:'Salesforce?'}),/source changed or expired/);
 f.table('sources').delete('source');await assert.rejects(()=>heartbeat._handler(f.ctx,{sessionId:session.sessionId}),/source changed/);
});});

test('Stop and abandoned-session expiry erase temporary text and guest evidence, preserving saved sources and other calls',async()=>{await configured(async()=>{
 for(const end of ['stop','expiry'] as const){
  const f=fixture(),session=await start._handler(f.ctx,{mode:'generic'});
  const row=f.table('liveCalls').get(session.sessionId);Object.assign(row,{sourceId:'guest',sourceOwnerKey:'guest:fictional'});
  f.table('sources').set('guest',{_id:'guest',ownerKey:'guest:fictional',saved:false});
  f.table('sources').set('saved',{_id:'saved',ownerKey:'user:fictional-user',saved:true});
  f.table('sourcePassages').set('guest-p',{_id:'guest-p',sourceId:'guest'});
  f.table('sourcePassages').set('saved-p',{_id:'saved-p',sourceId:'saved'});
  f.table('callText').set('temporary',{_id:'temporary',sessionId:session.sessionId});
  f.table('callText').set('other',{_id:'other',sessionId:'another-call'});
  if(end==='stop')await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});
  else {row.expiresAt=Date.now()-1;await cleanup._handler(f.ctx,{});}
  assert.equal(f.table('callText').has('temporary'),false);assert.equal(f.table('callText').has('other'),true);
  assert.equal(f.table('liveCalls').has(session.sessionId),false);
  assert.equal(f.table('sources').has('guest'),false);assert.equal(f.table('sourcePassages').has('guest-p'),false);
  assert.equal(f.table('sources').has('saved'),true);assert.equal(f.table('sourcePassages').has('saved-p'),true);
  assert.equal(f.table('spendingReservations').size,1);
 }
});});
