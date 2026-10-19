import {grantDevelopmentRetest} from '../convex/developmentTesting';
import {test} from 'node:test';import assert from 'node:assert/strict';import {workspaceFixture} from './workspace-fixture';import {accountTrial,allowedTrialCalls} from '../convex/freeTrial';
async function env(run:()=>Promise<void>){const url=process.env.CONVEX_CLOUD_URL,enabled=process.env.LIVE_CALL_TESTING_ENABLED;process.env.CONVEX_CLOUD_URL='https://calculating-gecko-263.convex.cloud';process.env.LIVE_CALL_TESTING_ENABLED='false';try{await run();}finally{if(url===undefined)delete process.env.CONVEX_CLOUD_URL;else process.env.CONVEX_CLOUD_URL=url;if(enabled===undefined)delete process.env.LIVE_CALL_TESTING_ENABLED;else process.env.LIVE_CALL_TESTING_ENABLED=enabled;}}
test('one development retest retains historical calls/minutes, grants once and cannot change production trial',async()=>env(async()=>{const f=workspaceFixture();f.table('users').set('fictional-user',{_id:'fictional-user'});const id=await f.ctx.db.insert('freeCallTrials',{userId:'fictional-user',callsUsed:3,listeningMs:480000,sessionId:null});assert.equal((await accountTrial(f.ctx,'fictional-user' as any)).exhausted,true);const args={trialId:id,expectedCallsUsed:3 as const,expectedListeningMs:480000};for(let i=0;i<2;i++){const granted=await grantDevelopmentRetest._handler(f.ctx,args);assert.equal(granted.callsRemaining,1);assert.equal(granted.callsUsed,3);assert.equal(granted.listeningMs,480000);}assert.equal((await accountTrial(f.ctx,'fictional-user' as any)).callsRemaining,1);const row=f.table('freeCallTrials').get(id);assert.equal(allowedTrialCalls(row,{CONVEX_CLOUD_URL:'https://deafening-frog-846.convex.cloud'}),3);process.env.CONVEX_CLOUD_URL='https://deafening-frog-846.convex.cloud';assert.equal((await accountTrial(f.ctx,'fictional-user' as any)).exhausted,true);await assert.rejects(()=>grantDevelopmentRetest._handler(f.ctx,args),/Development-only/);process.env.CONVEX_CLOUD_URL='https://calculating-gecko-263.convex.cloud';row.callsUsed=4;assert.equal((await accountTrial(f.ctx,'fictional-user' as any)).exhausted,true);}));
test('retest grant is internal and refuses changed use, active calls or exhausted minutes',async()=>env(async()=>{assert.equal(grantDevelopmentRetest.isInternal,true);for(const patch of [{callsUsed:4},{sessionId:'fictional-call'},{listeningMs:5400000}]){const f=workspaceFixture();f.table('users').set('fictional-user',{_id:'fictional-user'});const values={userId:'fictional-user',callsUsed:3,listeningMs:480000,sessionId:null,...patch};const id=await f.ctx.db.insert('freeCallTrials',values);await assert.rejects(()=>grantDevelopmentRetest._handler(f.ctx,{trialId:id,expectedCallsUsed:3,expectedListeningMs:values.listeningMs}));assert.equal(f.table('freeCallTrials').get(id).developmentCallLimit,undefined);}}));

test('two additional development calls preserve usage, are replay safe and cannot affect production',async()=>{
 const {grantOctoberSearchTests}=await import('../convex/developmentTesting');const priorCloud=process.env.CONVEX_CLOUD_URL,priorLive=process.env.LIVE_CALL_TESTING_ENABLED;
 const row:any={_id:'trial',userId:'user',callsUsed:4,listeningMs:723713,sessionId:null,developmentCallLimit:4};let patches=0;const ctx:any={db:{get:async(id:string)=>id==='trial'?row:{_id:'user'},patch:async(_id:string,value:any)=>{Object.assign(row,value);patches++;}}};const args:any={trialId:'trial',expectedCallsUsed:4,expectedListeningMs:723713};
 try{process.env.CONVEX_CLOUD_URL='https://calculating-gecko-263.convex.cloud';process.env.LIVE_CALL_TESTING_ENABLED='false';for(let i=0;i<2;i++)assert.equal((await grantOctoberSearchTests._handler(ctx,args)).callsRemaining,2);assert.equal(patches,1);assert.equal(row.callsUsed,4);assert.equal(row.listeningMs,723713);assert.equal(allowedTrialCalls(row),6);process.env.CONVEX_CLOUD_URL='https://deafening-frog-846.convex.cloud';assert.equal(allowedTrialCalls(row),3);await assert.rejects(()=>grantOctoberSearchTests._handler(ctx,args),/Development-only/);}
 finally{if(priorCloud===undefined)delete process.env.CONVEX_CLOUD_URL;else process.env.CONVEX_CLOUD_URL=priorCloud;if(priorLive===undefined)delete process.env.LIVE_CALL_TESTING_ENABLED;else process.env.LIVE_CALL_TESTING_ENABLED=priorLive;}
});


test('website retest grants only once to the reviewed exhausted browser and rejects production or changed use',async()=>{
 const {grantWebsiteRetest}=await import('../convex/developmentTesting');const before=process.env.CONVEX_CLOUD_URL;
 const realNow=Date.now;Date.now=()=>Date.parse('2026-10-17T10:00:00Z');
 const row:any={_id:'usage',day:'2026-10-17',attempts:3,activeUntil:0,activeKey:null};let patches=0;
 const ctx:any={db:{get:async()=>row,patch:async(_id:string,values:any)=>{patches++;Object.assign(row,values);}}};
 try{process.env.CONVEX_CLOUD_URL='https://deafening-frog-846.convex.cloud';await assert.rejects(()=>grantWebsiteRetest._handler(ctx,{usageId:'usage' as any}),/Development-only/);
 process.env.CONVEX_CLOUD_URL='https://calculating-gecko-263.convex.cloud';row.attempts=2;await assert.rejects(()=>grantWebsiteRetest._handler(ctx,{usageId:'usage' as any}),/changed/);row.attempts=3;
 assert.equal((await grantWebsiteRetest._handler(ctx,{usageId:'usage' as any})).remaining,3);row.attempts=1;
 assert.equal((await grantWebsiteRetest._handler(ctx,{usageId:'usage' as any})).remaining,2);assert.equal(patches,1);assert.equal(grantWebsiteRetest.isInternal,true);
 }finally{Date.now=realNow;if(before===undefined)delete process.env.CONVEX_CLOUD_URL;else process.env.CONVEX_CLOUD_URL=before;}
});


test('second website batch grants three once and the old grant cannot reset it again',async()=>{
 const {grantWebsiteRetest,grantWebsiteSecondRetest}=await import('../convex/developmentTesting');const before=process.env.CONVEX_CLOUD_URL;const now=Date.now;Date.now=()=>Date.parse('2026-10-17T11:00:00Z');
 const row:any={_id:'usage',day:'2026-10-17',attempts:2,activeUntil:0,developmentRetest:'2026-10-17'};let patches=0;const ctx:any={db:{get:async()=>row,patch:async(_id:string,values:any)=>{patches++;Object.assign(row,values);}}};
 try{process.env.CONVEX_CLOUD_URL='https://deafening-frog-846.convex.cloud';await assert.rejects(()=>grantWebsiteSecondRetest._handler(ctx,{usageId:'usage' as any}),/Development-only/);process.env.CONVEX_CLOUD_URL='https://calculating-gecko-263.convex.cloud';assert.equal((await grantWebsiteSecondRetest._handler(ctx,{usageId:'usage' as any})).remaining,3);row.attempts=3;assert.equal((await grantWebsiteSecondRetest._handler(ctx,{usageId:'usage' as any})).remaining,0);assert.equal((await grantWebsiteRetest._handler(ctx,{usageId:'usage' as any})).remaining,0);assert.equal(patches,1);
 }finally{Date.now=now;if(before===undefined)delete process.env.CONVEX_CLOUD_URL;else process.env.CONVEX_CLOUD_URL=before;}
});


test('third website batch grants once and cannot be replayed or run in production',async()=>{
 const {grantWebsiteThirdRetest,grantWebsiteSecondRetest}=await import('../convex/developmentTesting');const before=process.env.CONVEX_CLOUD_URL,now=Date.now;Date.now=()=>Date.parse('2026-10-17T12:00:00Z');
 const row:any={_id:'usage',day:'2026-10-17',attempts:3,activeUntil:0,developmentRetest:'2026-10-17-second'};let patches=0;const ctx:any={db:{get:async()=>row,patch:async(_id:string,values:any)=>{patches++;Object.assign(row,values);}}};
 try{process.env.CONVEX_CLOUD_URL='https://deafening-frog-846.convex.cloud';await assert.rejects(()=>grantWebsiteThirdRetest._handler(ctx,{usageId:'usage' as any}),/Development-only/);process.env.CONVEX_CLOUD_URL='https://calculating-gecko-263.convex.cloud';assert.equal((await grantWebsiteThirdRetest._handler(ctx,{usageId:'usage' as any})).remaining,3);row.attempts=3;assert.equal((await grantWebsiteThirdRetest._handler(ctx,{usageId:'usage' as any})).remaining,0);await assert.rejects(()=>grantWebsiteSecondRetest._handler(ctx,{usageId:'usage' as any}),/changed/);assert.equal(patches,1);assert.equal(grantWebsiteThirdRetest.isInternal,true);
 }finally{Date.now=now;if(before===undefined)delete process.env.CONVEX_CLOUD_URL;else process.env.CONVEX_CLOUD_URL=before;}
});


test('fourth website batch restores three questions once without changing production or admitting old grant replay',async()=>{
 const {grantWebsiteFourthRetest,grantWebsiteThirdRetest}=await import('../convex/developmentTesting');const before=process.env.CONVEX_CLOUD_URL,now=Date.now;Date.now=()=>Date.parse('2026-10-17T12:00:00Z');
 const row:any={_id:'usage',day:'2026-10-17',attempts:3,activeUntil:0,developmentRetest:'2026-10-17-third'};let patches=0;const ctx:any={db:{get:async()=>row,patch:async(_id:string,values:any)=>{patches++;Object.assign(row,values);}}};
 try{process.env.CONVEX_CLOUD_URL='https://deafening-frog-846.convex.cloud';await assert.rejects(()=>grantWebsiteFourthRetest._handler(ctx,{usageId:'usage' as any}),/Development-only/);process.env.CONVEX_CLOUD_URL='https://calculating-gecko-263.convex.cloud';assert.equal((await grantWebsiteFourthRetest._handler(ctx,{usageId:'usage' as any})).remaining,3);row.attempts=3;assert.equal((await grantWebsiteFourthRetest._handler(ctx,{usageId:'usage' as any})).remaining,0);await assert.rejects(()=>grantWebsiteThirdRetest._handler(ctx,{usageId:'usage' as any}),/changed/);assert.equal(patches,1);assert.equal(grantWebsiteFourthRetest.isInternal,true);
 }finally{Date.now=now;if(before===undefined)delete process.env.CONVEX_CLOUD_URL;else process.env.CONVEX_CLOUD_URL=before;}
});

test('three October flow tests preserve five historical calls, do not replenish on replay and cannot affect production',async()=>env(async()=>{
 const {grantOctoberFlowTests}=await import('../convex/developmentTesting');const old=process.env.CUELO_OCTOBER_FLOW_TESTS;process.env.CUELO_OCTOBER_FLOW_TESTS='2026-10-19';
 try{
  const f=workspaceFixture();f.table('users').set('fictional-user',{_id:'fictional-user'});const id=await f.ctx.db.insert('freeCallTrials',{userId:'fictional-user',callsUsed:5,listeningMs:803000,sessionId:null,developmentCallLimit:6});
  const args={trialId:id,expectedCallsUsed:5 as const,expectedListeningMs:803000};const result=await grantOctoberFlowTests._handler(f.ctx,args);assert.equal(result.callsRemaining,3);assert.equal(result.callsUsed,5);assert.equal(result.listeningMs,803000);
  const row=f.table('freeCallTrials').get(id);row.callsUsed=6;row.listeningMs+=1000;assert.equal((await grantOctoberFlowTests._handler(f.ctx,args)).callsRemaining,2);assert.equal(row.callsUsed,6);
  assert.equal(allowedTrialCalls(row,{CONVEX_CLOUD_URL:'https://deafening-frog-846.convex.cloud'}),3);
  process.env.CONVEX_CLOUD_URL='https://deafening-frog-846.convex.cloud';await assert.rejects(()=>grantOctoberFlowTests._handler(f.ctx,args),/Development-only/);
 }finally{if(old===undefined)delete process.env.CUELO_OCTOBER_FLOW_TESTS;else process.env.CUELO_OCTOBER_FLOW_TESTS=old;}
}));
