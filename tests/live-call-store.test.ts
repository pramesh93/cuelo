import {remove as removeLegacy} from '../convex/sources';
import {remove as removeLibrary} from '../convex/sourceLibrary';
import {overview} from '../convex/dashboard';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {start,append,change,prepare,reserveAnswer,check,credentialAdmission,heartbeat,queuedPrepare,queuedComplete,context,cleanup,listeningReady,availability,connectionFailed,typeQuestion} from '../convex/liveCalls';
function fixture(){let subject:string|null='fictional-user|fictional-session';let serial=0;const tables=new Map<string,Map<string,any>>();const table=(name:string)=>{if(!tables.has(name))tables.set(name,new Map());return tables.get(name)!;};table('testerAccess').set('invite',{_id:'invite',userId:'fictional-user',enabled:true});
 const ctx:any={auth:{getUserIdentity:async()=>subject?{subject}:null},db:{get:async(id:string)=>{for(const t of tables.values())if(t.has(id))return {...t.get(id)};return null;},query:(name:string)=>{const select=(callback:any)=>{const rules:Array<(r:any)=>boolean>=[];const q:any={eq:(f:string,v:any)=>{rules.push(r=>r[f]===v);return q;},lte:(f:string,v:any)=>{rules.push(r=>r[f]<=v);return q;},search:()=>q};callback(q);let descending=false;const result={order:(direction:string)=>{descending=direction==='desc';return result;},take:async(n:number)=>[...table(name).values()].filter(r=>rules.every(rule=>rule(r))).sort((a,b)=>descending?b.sequence-a.sequence:0).slice(0,n).map(r=>({...r}))};return result;};return {withIndex:(_name:string,callback:any)=>select(callback),withSearchIndex:(_name:string,callback:any)=>select(callback)};},insert:async(name:string,row:any)=>{const id=`${name}-${++serial}`;table(name).set(id,{_id:id,_creationTime:Date.now(),...row});return id;},patch:async(id:string,values:any)=>{for(const t of tables.values())if(t.has(id))Object.assign(t.get(id),values);},delete:async(id:string)=>{for(const t of tables.values())t.delete(id);}}};return {ctx,table,setSubject:(s:string|null)=>subject=s};}
const settings={LIVE_CALL_TESTING_ENABLED:'true',V1_PAID_TESTING_ENABLED:'true',DEEPGRAM_API_KEY:'fake',OPENAI_API_KEY:'fake',LIVE_CALL_TEST_SESSION_LIMIT:'2',LIVE_CALL_MAX_CONNECTIONS:'2',LIVE_CALL_MAX_DETECTIONS:'12',LIVE_CALL_MAX_ANSWERS:'4',LIVE_CALL_RESERVE_PAISE:'10000'};
async function configured(run:()=>Promise<void>){const old={...process.env};Object.assign(process.env,settings);try{await run();}finally{for(const key of Object.keys(settings)){if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}}}
test('disabled or signed-out live admission writes no sessions, usage or spending',async()=>{await configured(async()=>{const f=fixture();delete process.env.LIVE_CALL_TESTING_ENABLED;await assert.rejects(()=>start._handler(f.ctx,{mode:'generic'}),/not enabled/);assert.equal(f.table('spendingReservations').size,0);process.env.LIVE_CALL_TESTING_ENABLED='true';f.setSubject(null);await assert.rejects(()=>start._handler(f.ctx,{mode:'generic'}),/Sign in/);assert.equal(f.table('liveCalls').size,0);});});
test('session admission reserves once, rejects concurrency/source smuggling, pause preserves deadline, Stop deletes text',async()=>{await configured(async()=>{const f=fixture();await assert.rejects(()=>start._handler(f.ctx,{mode:'generic',sourceId:'foreign-source' as any}),/must not/);const session=await start._handler(f.ctx,{mode:'generic'});const row=f.table('liveCalls').get(session.sessionId);assert.equal(f.table('spendingReservations').size,1);await assert.rejects(()=>start._handler(f.ctx,{mode:'generic'}),/already active/);const grant=await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});assert.equal(grant.deadline,session.deadline);
 const rep=await append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'salesperson',text:'Does it support single sign-on?'});assert.equal(await prepare._handler(f.ctx,{sessionId:session.sessionId,utteranceId:rep.utteranceId}),null);
 const customer=await append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'customer',text:'How does single sign-on work?'});assert.ok(await prepare._handler(f.ctx,{sessionId:session.sessionId,utteranceId:customer.utteranceId}));assert.equal(await prepare._handler(f.ctx,{sessionId:session.sessionId,utteranceId:customer.utteranceId}),null);
 await change._handler(f.ctx,{sessionId:session.sessionId,state:'paused'});assert.equal(row.deadline,session.deadline);assert.equal(await check._handler(f.ctx,{sessionId:session.sessionId,revision:customer.revision}),false);await change._handler(f.ctx,{sessionId:session.sessionId,state:'active'});await assert.rejects(()=>append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'customer',text:'old audio'}),/Old audio/);await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});assert.equal(f.table('callText').size,0);assert.equal(f.table('liveCalls').size,0);assert.equal(f.table('spendingReservations').size,1);});});
test('other accounts, newer questions, signed-out sessions and expired deadlines invalidate pending work',async()=>{await configured(async()=>{const f=fixture();const session=await start._handler(f.ctx,{mode:'generic'});const grant=await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});const first=await append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'customer',text:'First question?'});assert.equal(await check._handler(f.ctx,{sessionId:session.sessionId,revision:first.revision}),true);await append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'customer',text:'New question?'});assert.equal(await check._handler(f.ctx,{sessionId:session.sessionId,revision:first.revision}),false);f.setSubject('another-user|another-session');await assert.rejects(()=>change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'}),/unavailable/);f.setSubject('fictional-user|fictional-session');f.setSubject(null);assert.equal(await check._handler(f.ctx,{sessionId:session.sessionId}),false);await assert.rejects(()=>heartbeat._handler(f.ctx,{sessionId:session.sessionId}),/unavailable/);f.setSubject('fictional-user|fictional-session');f.table('liveCalls').get(session.sessionId).deadline=Date.now()-1;assert.equal(await check._handler(f.ctx,{sessionId:session.sessionId}),false);await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});assert.equal(f.table('callText').size,0);});});

test('repeated Stop succeeds after server cleanup without weakening ownership or hiding failures',async()=>{await configured(async()=>{
 const f=fixture(),session=await start._handler(f.ctx,{mode:'generic'});
 f.setSubject('another-user|another-session');
 await assert.rejects(()=>change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'}),/unavailable/);
 assert.equal(f.table('liveCalls').size,1);
 f.setSubject('fictional-user|fictional-session');
 await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});
 assert.equal(await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'}),null);
 assert.equal(f.table('liveCalls').size,0);assert.equal(f.table('callText').size,0);
 assert.equal(f.table('spendingReservations').size,1);
 await assert.rejects(()=>change._handler(f.ctx,{sessionId:session.sessionId,state:'paused'}),/unavailable/);
 f.setSubject(null);
 await assert.rejects(()=>change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'}),/unavailable/);
 f.setSubject('fictional-user|fictional-session');
 const next=await start._handler(f.ctx,{mode:'generic'});
 f.ctx.db.delete=async()=>{throw Error('SIMULATED deletion failed');};
 await assert.rejects(()=>change._handler(f.ctx,{sessionId:next.sessionId,state:'stopped'}),/deletion failed/);
});});

test('queued questions survive later speech, reserve once across Pause, and clear at Stop',async()=>{await configured(async()=>{
 const f=fixture(),session=await start._handler(f.ctx,{mode:'generic'}),grant=await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});
 const first=await append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'customer',text:'What is the price?'});
 const later=await append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'customer',text:'We have a large team.'});
 const args={sessionId:session.sessionId,utteranceId:first.utteranceId,generation:grant.generation};
 assert.ok(await queuedPrepare._handler(f.ctx,{...args,phase:'detect'}));
 assert.equal(await queuedComplete._handler(f.ctx,{...args,question:'What is the price?'}),true);
 assert.ok(await queuedPrepare._handler(f.ctx,{...args,phase:'answer'}));assert.equal(f.table('liveCalls').get(session.sessionId).answers,1);
 await assert.rejects(()=>queuedPrepare._handler(f.ctx,{...args,phase:'answer'}),/already/);
 const second={...args,utteranceId:later.utteranceId};assert.ok(await queuedPrepare._handler(f.ctx,{...second,phase:'detect'}));await queuedComplete._handler(f.ctx,{...second,skipped:true});assert.equal((await queuedPrepare._handler(f.ctx,{...second,phase:'detect'}))?.skipped,true);
 await change._handler(f.ctx,{sessionId:session.sessionId,state:'paused'});assert.equal(await check._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation}),false);
 await change._handler(f.ctx,{sessionId:session.sessionId,state:'active'});const resumed=await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});
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

test('trial counts only successful listening once; failed starts, Pause and reconnect do not consume extra calls',async()=>{await configured(async()=>{
 const f=fixture();f.table('testerAccess').clear();
 const failed=await start._handler(f.ctx,{mode:'generic'});await change._handler(f.ctx,{sessionId:failed.sessionId,state:'stopped'});
 assert.equal((await availability._handler(f.ctx,{})).trial?.callsUsed,0);
 const session=await start._handler(f.ctx,{mode:'generic'});
 await assert.rejects(()=>listeningReady._handler(f.ctx,{sessionId:session.sessionId}),/must connect/);
 await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});
 assert.equal((await availability._handler(f.ctx,{})).trial?.callsUsed,1);
 await change._handler(f.ctx,{sessionId:session.sessionId,state:'paused'});await change._handler(f.ctx,{sessionId:session.sessionId,state:'active'});
 await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});
 assert.equal((await availability._handler(f.ctx,{})).trial?.callsUsed,1);
});});

test('three calls exhaust one account across sessions; another account remains independent and no fourth admission spends',async()=>{await configured(async()=>{
 process.env.LIVE_CALL_TEST_SESSION_LIMIT='10';const f=fixture();
 for(let i=0;i<3;i++){const call=await start._handler(f.ctx,{mode:'generic'});await credentialAdmission._handler(f.ctx,{sessionId:call.sessionId});await listeningReady._handler(f.ctx,{sessionId:call.sessionId});await change._handler(f.ctx,{sessionId:call.sessionId,state:'stopped'});}
 const before=f.table('spendingReservations').size;assert.equal((await availability._handler(f.ctx,{})).trial?.exhausted,true);
 await assert.rejects(()=>start._handler(f.ctx,{mode:'generic'}),/free trial has ended/);assert.equal(f.table('spendingReservations').size,before);
 f.setSubject('another-user|another-device');assert.equal((await availability._handler(f.ctx,{})).trial?.callsRemaining,3);
 const other=await start._handler(f.ctx,{mode:'generic'});await change._handler(f.ctx,{sessionId:other.sessionId,state:'stopped'});
 f.setSubject('fictional-user|new-browser-session');assert.equal((await availability._handler(f.ctx,{})).trial?.callsRemaining,0);
});});

test('listening time uses server time, excludes Pause, and limits the final session to the remaining 90-minute allowance',async()=>{await configured(async()=>{
 const realNow=Date.now;let now=1800000000000;Date.now=()=>now;
 try{const f=fixture();const session=await start._handler(f.ctx,{mode:'generic'});await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});
 now+=60000;await heartbeat._handler(f.ctx,{sessionId:session.sessionId});await change._handler(f.ctx,{sessionId:session.sessionId,state:'paused'});
 assert.equal((await availability._handler(f.ctx,{})).trial?.listeningMs,60000);
 now+=10*60000;assert.equal((await availability._handler(f.ctx,{})).trial?.listeningMs,60000);
 await change._handler(f.ctx,{sessionId:session.sessionId,state:'active'});await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});
 now+=30000;await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});assert.equal((await availability._handler(f.ctx,{})).trial?.listeningMs,90000);
 const record=[...f.table('freeCallTrials').values()][0];record.listeningMs=90*60000-30000;
 const last=await start._handler(f.ctx,{mode:'generic'});assert.equal(last.deadline,now+30000);await credentialAdmission._handler(f.ctx,{sessionId:last.sessionId});const ready=await listeningReady._handler(f.ctx,{sessionId:last.sessionId});assert.equal(ready.trialTimeLimit,true);
 now+=30000;assert.equal((await availability._handler(f.ctx,{})).trial?.exhausted,true);assert.equal(await check._handler(f.ctx,{sessionId:last.sessionId}),false);
 await change._handler(f.ctx,{sessionId:last.sessionId,state:'stopped'});assert.equal((await availability._handler(f.ctx,{})).trial?.listeningMs,90*60000);
 await assert.rejects(()=>start._handler(f.ctx,{mode:'generic'}),/free trial has ended/);
 }finally{Date.now=realNow;}
});});

test('expiry settles abandoned listening only through its lease and never deletes the account trial ledger',async()=>{await configured(async()=>{
 const realNow=Date.now;let now=1800000000000;Date.now=()=>now;
 try{const f=fixture(),call=await start._handler(f.ctx,{mode:'generic'});await credentialAdmission._handler(f.ctx,{sessionId:call.sessionId});await listeningReady._handler(f.ctx,{sessionId:call.sessionId});now+=5*60000;
 await cleanup._handler(f.ctx,{});const trial=(await availability._handler(f.ctx,{})).trial!;assert.equal(trial.listeningMs,120000);assert.equal(trial.callsUsed,1);assert.equal(f.table('freeCallTrials').size,1);await cleanup._handler(f.ctx,{});assert.equal((await availability._handler(f.ctx,{})).trial?.listeningMs,120000);
 }finally{Date.now=realNow;}
});});

test('third trial call can pause and resume; historical sessions do not consume new trial credits',async()=>{await configured(async()=>{
 const f=fixture(),call=await start._handler(f.ctx,{mode:'generic'});const record=[...f.table('freeCallTrials').values()][0];record.callsUsed=2;
 await credentialAdmission._handler(f.ctx,{sessionId:call.sessionId});await listeningReady._handler(f.ctx,{sessionId:call.sessionId});assert.equal(record.callsUsed,3);
 await change._handler(f.ctx,{sessionId:call.sessionId,state:'paused'});await change._handler(f.ctx,{sessionId:call.sessionId,state:'active'});await credentialAdmission._handler(f.ctx,{sessionId:call.sessionId});await listeningReady._handler(f.ctx,{sessionId:call.sessionId});assert.equal(record.callsUsed,3);
 await change._handler(f.ctx,{sessionId:call.sessionId,state:'stopped'});
 f.setSubject('historical-user|session');f.table('liveCalls').set('old',{_id:'old',userId:'historical-user',state:'active',deadline:Date.now()+60000,expiresAt:Date.now()+60000});
 assert.equal((await availability._handler(f.ctx,{})).trial?.callsRemaining,3);await change._handler(f.ctx,{sessionId:'old' as any,state:'stopped'});assert.equal((await availability._handler(f.ctx,{})).trial?.callsRemaining,3);
});});

test('failed credential setup consumes no trial call; reconnect failure keeps the counted call paused',async()=>{await configured(async()=>{
 const f=fixture(),first=await start._handler(f.ctx,{mode:'generic'});await connectionFailed._handler(f.ctx,{sessionId:first.sessionId});assert.equal((await availability._handler(f.ctx,{})).trial?.callsUsed,0);assert.equal(f.table('liveCalls').size,0);
 const next=await start._handler(f.ctx,{mode:'generic'});await credentialAdmission._handler(f.ctx,{sessionId:next.sessionId});await listeningReady._handler(f.ctx,{sessionId:next.sessionId});await connectionFailed._handler(f.ctx,{sessionId:next.sessionId});
 assert.equal(f.table('liveCalls').get(next.sessionId).state,'paused');assert.equal((await availability._handler(f.ctx,{})).trial?.callsUsed,1);
 await heartbeat._handler(f.ctx,{sessionId:next.sessionId});assert.equal(f.table('liveCalls').get(next.sessionId).state,'paused');
 f.setSubject('another-user|session');await assert.rejects(()=>connectionFailed._handler(f.ctx,{sessionId:next.sessionId}),/unavailable/);
});});

test('production accepts a fifth answer within the account trial',async()=>{await configured(async()=>{const previous=process.env.CONVEX_CLOUD_URL;process.env.CONVEX_CLOUD_URL='https://deafening-frog-846.convex.cloud';try{const f=fixture();const session=await start._handler(f.ctx,{mode:'generic'});assert.equal(session.answerLimit,0);await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});const row=f.table('liveCalls').get(session.sessionId);for(let n=0;n<5;n++)await reserveAnswer._handler(f.ctx,{sessionId:session.sessionId,revision:row.customerRevision});assert.equal(f.table('liveCalls').get(session.sessionId).answers,5);assert.equal(f.table('freeCallTrials').values().next().value.callsUsed,1);}finally{if(previous===undefined)delete process.env.CONVEX_CLOUD_URL;else process.env.CONVEX_CLOUD_URL=previous;}});});

test('finished call keeps only date/duration/answer totals while Stop clears text and retry is idempotent',async()=>{await configured(async()=>{
 const f=fixture();const oldNow=Date.now;let now=oldNow();Date.now=()=>now;
 try{const session=await start._handler(f.ctx,{mode:'generic'});const grant=await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});now+=10000;
 const turn=await append._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,speaker:'customer',text:'Fictional example question?'});const args={sessionId:session.sessionId,utteranceId:turn.utteranceId,generation:grant.generation};await queuedPrepare._handler(f.ctx,{...args,phase:'detect'});await queuedComplete._handler(f.ctx,{...args,question:'Fictional example question?'});await queuedPrepare._handler(f.ctx,{...args,phase:'answer'});const result={question:'Fictional example question?',mode:'generic' as const,status:'generic' as const,bullets:['Fictional response.'],message:'',citations:[],source:null,elapsedMs:1,budgetAlert:false};assert.equal(await queuedComplete._handler(f.ctx,{...args,answered:true,answerResult:result}),true);assert.equal(await queuedComplete._handler(f.ctx,{...args,answered:true,answerResult:result}),false);
 await change._handler(f.ctx,{sessionId:session.sessionId,state:'paused'});now+=30000;await change._handler(f.ctx,{sessionId:session.sessionId,state:'active'});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});now+=5000;await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});
 assert.equal(f.table('callText').size,0);assert.equal(f.table('liveCalls').size,0);assert.equal(f.table('callRecords').size,1);const record=[...f.table('callRecords').values()][0];assert.equal(record.listeningMs,15000);assert.equal(record.answers,1);assert.deepEqual(Object.keys(record).sort(),['_creationTime','_id','answers','endedAt','listeningMs','startedAt','userId']);const metrics=[...f.table('accountMetrics').values()][0];assert.equal(metrics.calls,1);assert.equal(metrics.answers,1);assert.equal(metrics.listeningMs,15000);
 }finally{Date.now=oldNow;}
});});
test('failed listening setup leaves no recent-call record',async()=>{await configured(async()=>{const f=fixture();const session=await start._handler(f.ctx,{mode:'generic'});await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await connectionFailed._handler(f.ctx,{sessionId:session.sessionId});assert.equal(f.table('callRecords').size,0);assert.equal(f.table('accountMetrics').size,0);});});

test('analytics unlock only after successful listening ends, never on Start or Pause',async()=>{await configured(async()=>{const f=fixture();const session=await start._handler(f.ctx,{mode:'generic'});assert.equal((await overview._handler(f.ctx,{})).analyticsUnlocked,false);await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});assert.equal((await overview._handler(f.ctx,{})).callState,'active');await change._handler(f.ctx,{sessionId:session.sessionId,state:'paused'});let data=await overview._handler(f.ctx,{});assert.equal(data.analyticsUnlocked,false);assert.equal(data.callState,'paused');assert.equal(data.trial.callsRemaining,2);await change._handler(f.ctx,{sessionId:session.sessionId,state:'active'});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});assert.equal((await overview._handler(f.ctx,{})).analyticsUnlocked,false);await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});data=await overview._handler(f.ctx,{});assert.equal(data.analyticsUnlocked,true);assert.equal(data.totals.calls,1);assert.equal(data.callState,'idle');f.setSubject('other-user|session');assert.equal((await overview._handler(f.ctx,{})).analyticsUnlocked,false);});});

test('typed questions use owned active listening, cache explicit detection, share answer allowance and expire with call text',async()=>{await configured(async()=>{
 const f=fixture();const session=await start._handler(f.ctx,{mode:'generic'});const grant=await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});
 await assert.rejects(()=>typeQuestion._handler(f.ctx,{sessionId:session.sessionId,generation:grant.generation,text:'Example?'}),/Start listening/);
 await listeningReady._handler(f.ctx,{sessionId:session.sessionId});const args={sessionId:session.sessionId,generation:grant.generation};
 await assert.rejects(()=>typeQuestion._handler(f.ctx,{...args,text:' '}),/Type a question/);await assert.rejects(()=>typeQuestion._handler(f.ctx,{...args,text:'x'.repeat(1001)}),/Type a question/);
 const typed=await typeQuestion._handler(f.ctx,{...args,text:' Example typed question? '});const text=f.table('callText').get(typed.utteranceId);assert.equal(text.question,'Example typed question?');assert.equal(text.questionStatus,'question');
 const before=f.table('liveCalls').get(session.sessionId).detections;const prepared=await queuedPrepare._handler(f.ctx,{...args,utteranceId:typed.utteranceId,phase:'detect'});assert.equal(prepared.cached,true);assert.equal(prepared.question,'Example typed question?');assert.equal(f.table('liveCalls').get(session.sessionId).detections,before);
 await queuedPrepare._handler(f.ctx,{...args,utteranceId:typed.utteranceId,phase:'answer'});assert.equal(f.table('liveCalls').get(session.sessionId).answers,1);assert.equal((await context._handler(f.ctx,{sessionId:session.sessionId,question:text.question})).conversation.some((x:any)=>x.text===text.question),true);
 f.setSubject('another-user|session');await assert.rejects(()=>typeQuestion._handler(f.ctx,{...args,text:'Private?'}),/unavailable/);f.setSubject(null);await assert.rejects(()=>typeQuestion._handler(f.ctx,{...args,text:'Private?'}),/unavailable/);f.setSubject('fictional-user|fictional-session');
 await change._handler(f.ctx,{sessionId:session.sessionId,state:'paused'});await assert.rejects(()=>typeQuestion._handler(f.ctx,{...args,text:'Paused?'}),/stopped or expired/);await change._handler(f.ctx,{sessionId:session.sessionId,state:'active'});const resumed=await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});await assert.rejects(()=>typeQuestion._handler(f.ctx,{...args,text:'Old?'}),/Old audio/);
 f.table('liveCalls').get(session.sessionId).answers=4;await assert.rejects(()=>typeQuestion._handler(f.ctx,{sessionId:session.sessionId,generation:resumed.generation,text:'Limit?'}),/allowance/);await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});assert.equal(f.table('callText').size,0);
});});

test('typed document answers retain the session source and share question capacity and provider-off enforcement',async()=>{await configured(async()=>{const f=fixture();const session=await start._handler(f.ctx,{mode:'generic'});const grant=await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});const row=f.table('liveCalls').get(session.sessionId);Object.assign(row,{mode:'document',sourceId:'typed-source',sourceOwnerKey:'user:fictional-user'});f.table('sources').set('typed-source',{_id:'typed-source',ownerKey:'user:fictional-user',title:'Fictional guide',kind:'text',url:null,pageCount:null,passageCount:1,saved:true,expiresAt:null});f.table('sourcePassages').set('typed-passage',{_id:'typed-passage',sourceId:'typed-source',ordinal:0,reference:'Support',text:'Fictional guide includes email support.'});const args={sessionId:session.sessionId,generation:grant.generation,text:'What support is included?'};const turn=await typeQuestion._handler(f.ctx,args);const prepared=await queuedPrepare._handler(f.ctx,{...args,utteranceId:turn.utteranceId,phase:'answer'});assert.equal(prepared.mode,'document');const evidence=await context._handler(f.ctx,{sessionId:session.sessionId,question:args.text});assert.equal(evidence.source.id,'typed-source');assert.equal(evidence.passages[0].reference,'Support');assert.equal(row.detections,1);row.detections=row.maxDetections;await assert.rejects(()=>typeQuestion._handler(f.ctx,args),/question allowance/);row.detections=0;delete process.env.LIVE_CALL_TESTING_ENABLED;await assert.rejects(()=>typeQuestion._handler(f.ctx,args),/unavailable/);assert.equal(f.table('callText').size,1);});});

test('multi-source call validates all ownership, protects secondary sources while paused, labels unique evidence and deletes links on Stop',async()=>{await configured(async()=>{
 const f=fixture();const add=async(title:string,text:string)=>{const id=await f.ctx.db.insert('sources',{ownerKey:'user:fictional-user',title,kind:'text',url:null,pageCount:null,passageCount:1,saved:true,expiresAt:null,library:true,createdAt:1,updatedAt:1});await f.ctx.db.insert('sourcePassages',{sourceId:id,ordinal:0,reference:'Features',text});return id;};
 const a=await add('Fictional CRM guide','Salesforce integration is included.'),b=await add('Fictional identity guide','SSO is included.');await f.ctx.db.patch(a,{library:undefined});
 const session=await start._handler(f.ctx,{mode:'document',sourceIds:[a,b]});assert.equal(f.table('liveCallSources').size,2);assert.equal(f.table('liveCalls').get(session.sessionId).sourceIds.length,2);const evidence=await context._handler(f.ctx,{sessionId:session.sessionId,question:'Salesforce and SSO?'});assert.deepEqual(evidence.passages.map(p=>p.ordinal),[0,1000]);assert.deepEqual(evidence.passages.map(p=>p.sourceTitle),['Fictional CRM guide','Fictional identity guide']);assert.equal(evidence.sources.length,2);
 await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});assert.equal((await availability._handler(f.ctx,{})).trial?.callsUsed,1);await f.ctx.db.patch(b,{ownerKey:'user:another-user'});await assert.rejects(()=>context._handler(f.ctx,{sessionId:session.sessionId,question:'SSO?'}),/changed or expired/);await assert.rejects(()=>heartbeat._handler(f.ctx,{sessionId:session.sessionId}),/source changed/);await f.ctx.db.patch(b,{ownerKey:'user:fictional-user'});await change._handler(f.ctx,{sessionId:session.sessionId,state:'paused'});await assert.rejects(()=>removeLibrary._handler(f.ctx,{id:b,version:1}),/Stop Cuelo/);await assert.rejects(()=>removeLegacy._handler(f.ctx,{expectedId:a}),/Stop Cuelo/);
 await f.ctx.db.patch(b,{ownerKey:'user:another-user'});await assert.rejects(()=>change._handler(f.ctx,{sessionId:session.sessionId,state:'active'}),/source changed/);await assert.rejects(()=>context._handler(f.ctx,{sessionId:session.sessionId,question:'SSO?'}),/stopped or expired/);await f.ctx.db.patch(b,{ownerKey:'user:fictional-user'});await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});assert.equal(f.table('liveCallSources').size,0);assert.equal(f.table('sources').size,2);await removeLibrary._handler(f.ctx,{id:b,version:1});assert.equal(f.table('sources').size,1);
});});
test('multi-source invalid choices fail before spending: foreign secondary, duplicate, missing, too many or generic-source smuggling',async()=>{await configured(async()=>{for(const choice of ['foreign','duplicate','missing','many','generic'] as const){const f=fixture();const a=await f.ctx.db.insert('sources',{ownerKey:'user:fictional-user',saved:true,expiresAt:null}),b=await f.ctx.db.insert('sources',{ownerKey:'user:another-user',saved:true,expiresAt:null});const ids=choice==='foreign'?[a,b]:choice==='duplicate'?[a,a]:choice==='missing'?[]:choice==='many'?Array.from({length:21},(_,i)=>'fictional-'+i):[a];await assert.rejects(()=>start._handler(f.ctx,{mode:choice==='generic'?'generic':'document',sourceIds:ids}));assert.equal(f.table('liveCalls').size,0);assert.equal(f.table('liveCallSources').size,0);assert.equal(f.table('spendingReservations').size,0);}});});

test('combined source capacity refuses oversized selection before call admission or spending',async()=>{await configured(async()=>{const f=fixture();const ids=[];for(let n=0;n<6;n++){const id=await f.ctx.db.insert('sources',{ownerKey:'user:fictional-user',saved:true,expiresAt:null});ids.push(id);for(let ordinal=0;ordinal<25;ordinal++)await f.ctx.db.insert('sourcePassages',{sourceId:id,ordinal,reference:'Fictional section',text:'x'.repeat(8000)});}await assert.rejects(()=>start._handler(f.ctx,{mode:'document',sourceIds:ids}),/too much text/);assert.equal(f.table('liveCalls').size,0);assert.equal(f.table('spendingReservations').size,0);});});

test('development live admission enforces its allocated budget before any reservation or session write',async()=>configured(async()=>{const previous=process.env.CONVEX_CLOUD_URL;process.env.CONVEX_CLOUD_URL='https://calculating-gecko-263.convex.cloud';try{const f=fixture();f.table('spendingMonths').set('month',{_id:'month',month:new Date().toISOString().slice(0,7),reservedPaise:150000,reservations:3});await assert.rejects(()=>start._handler(f.ctx,{mode:'generic'}),/budget is reached/);assert.equal(f.table('spendingReservations').size,0);assert.equal(f.table('liveCalls').size,0);}finally{if(previous===undefined)delete process.env.CONVEX_CLOUD_URL;else process.env.CONVEX_CLOUD_URL=previous;}}));
test('approved fourth development call counts once, permits Resume and then blocks another call',async()=>configured(async()=>{const previous=process.env.CONVEX_CLOUD_URL;process.env.CONVEX_CLOUD_URL='https://calculating-gecko-263.convex.cloud';try{const f=fixture();f.table('freeCallTrials').set('trial',{_id:'trial',userId:'fictional-user',callsUsed:3,listeningMs:480000,sessionId:null,developmentCallLimit:4});const session=await start._handler(f.ctx,{mode:'generic'});await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});assert.equal((await availability._handler(f.ctx,{})).trial?.callsUsed,4);await change._handler(f.ctx,{sessionId:session.sessionId,state:'paused'});await change._handler(f.ctx,{sessionId:session.sessionId,state:'active'});await credentialAdmission._handler(f.ctx,{sessionId:session.sessionId});await listeningReady._handler(f.ctx,{sessionId:session.sessionId});assert.equal((await availability._handler(f.ctx,{})).trial?.callsUsed,4);await change._handler(f.ctx,{sessionId:session.sessionId,state:'stopped'});await assert.rejects(()=>start._handler(f.ctx,{mode:'generic'}),/free trial has ended/);}finally{if(previous===undefined)delete process.env.CONVEX_CLOUD_URL;else process.env.CONVEX_CLOUD_URL=previous;}}));
