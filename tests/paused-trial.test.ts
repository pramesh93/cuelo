import {test} from 'node:test';import assert from 'node:assert/strict';import {workspaceFixture} from './workspace-fixture';
import {start,change,credentialAdmission,listeningReady,heartbeat} from '../convex/liveCalls';import {accountTrial} from '../convex/freeTrial';
const settings={CUELO_IDLE_PAUSE_ENABLED:'true',V1_PAID_TESTING_ENABLED:'true',LIVE_CALL_TESTING_ENABLED:'true',OPENAI_API_KEY:'fictional',DEEPGRAM_API_KEY:'fictional',LIVE_CALL_TEST_SESSION_LIMIT:'20',LIVE_CALL_MAX_CONNECTIONS:'2',LIVE_CALL_MAX_DETECTIONS:'20',LIVE_CALL_MAX_ANSWERS:'4',LIVE_CALL_RESERVE_PAISE:'50000'};
async function configured(run:(f:ReturnType<typeof workspaceFixture>,advance:(ms:number)=>void)=>Promise<void>){const old={...process.env},now=Date.now;let clock=Date.now();Object.assign(process.env,settings);Date.now=()=>clock;try{await run(workspaceFixture(),ms=>clock+=ms);}finally{Date.now=now;for(const k of Object.keys(settings))if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}}
test('Pause consumes trial minutes while listening analytics stop, with one call counted across repeated Resume',async()=>configured(async(f,advance)=>{
 const call=await start._handler(f.ctx,{mode:'generic'});assert.equal(call.idlePauseEnabled,true);await credentialAdmission._handler(f.ctx,{sessionId:call.sessionId});await listeningReady._handler(f.ctx,{sessionId:call.sessionId});
 advance(30000);await change._handler(f.ctx,{sessionId:call.sessionId,state:'paused'});advance(45000);await heartbeat._handler(f.ctx,{sessionId:call.sessionId});let trial=await accountTrial(f.ctx,'fictional-user' as any);assert.equal(trial.trialMs,75000);assert.equal(trial.listeningMs,30000);assert.equal(trial.callsUsed,1);
 const resumed=await change._handler(f.ctx,{sessionId:call.sessionId,state:'active'});assert.ok(resumed?.generation);await listeningReady._handler(f.ctx,{sessionId:call.sessionId});advance(15000);
 await change._handler(f.ctx,{sessionId:call.sessionId,state:'stopped'});trial=await accountTrial(f.ctx,'fictional-user' as any);assert.equal(trial.trialMs,90000);assert.equal(trial.listeningMs,45000);assert.equal(trial.callsUsed,1);
 await change._handler(f.ctx,{sessionId:call.sessionId,state:'stopped'});assert.equal((await accountTrial(f.ctx,'fictional-user' as any)).trialMs,90000);
}));
test('paused trial expiry blocks Resume and preserves the real trial-ended message',async()=>configured(async(f,advance)=>{
 await f.ctx.db.insert('freeCallTrials',{userId:'fictional-user',callsUsed:0,listeningMs:0,trialTimeMs:5400000-60000,sessionId:null});
 const call=await start._handler(f.ctx,{mode:'generic'});await credentialAdmission._handler(f.ctx,{sessionId:call.sessionId});await listeningReady._handler(f.ctx,{sessionId:call.sessionId});advance(10000);await change._handler(f.ctx,{sessionId:call.sessionId,state:'paused'});advance(50000);
 const trial=await accountTrial(f.ctx,'fictional-user' as any);assert.equal(trial.remainingMs,0);assert.equal(trial.exhausted,true);await assert.rejects(()=>change._handler(f.ctx,{sessionId:call.sessionId,state:'active'}),/free trial has ended/);
 await change._handler(f.ctx,{sessionId:call.sessionId,state:'stopped'});assert.equal((await accountTrial(f.ctx,'fictional-user' as any)).trialMs,5400000);
}));
test('idle-mode reconnects use a failure cooldown instead of the old two-connection lifetime cap',async()=>configured(async(f,advance)=>{
 const call=await start._handler(f.ctx,{mode:'generic'});for(let n=0;n<5;n++){await credentialAdmission._handler(f.ctx,{sessionId:call.sessionId});await listeningReady._handler(f.ctx,{sessionId:call.sessionId});if(n===0)await assert.rejects(()=>credentialAdmission._handler(f.ctx,{sessionId:call.sessionId}),/reconnect.*moment/i);if(n<4){await change._handler(f.ctx,{sessionId:call.sessionId,state:'paused'});advance(1000);await change._handler(f.ctx,{sessionId:call.sessionId,state:'active'});}}
 assert.equal(f.table('liveCalls').get(call.sessionId).connections,5);assert.equal((await accountTrial(f.ctx,'fictional-user' as any)).callsUsed,1);
 const bad=workspaceFixture();const fresh=await start._handler(bad.ctx,{mode:'generic'});await credentialAdmission._handler(bad.ctx,{sessionId:fresh.sessionId});await assert.rejects(()=>credentialAdmission._handler(bad.ctx,{sessionId:fresh.sessionId}),/reconnect.*moment/i);
}));
