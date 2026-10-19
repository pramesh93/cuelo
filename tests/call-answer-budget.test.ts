import {test} from 'node:test';import assert from 'node:assert/strict';
import {workspaceFixture} from './workspace-fixture';
import {start,change} from '../convex/liveCalls';import {reserve} from '../convex/spending';
import {allocationLimit,monthlyBudget} from '../convex/spendingPolicy';
const config={CONVEX_CLOUD_URL:'https://calculating-gecko-263.convex.cloud',CUELO_OCTOBER_FLOW_TESTS:'2026-10-19',LIVE_CALL_ANSWER_BUDGET_ENABLED:'true',LIVE_CALL_TESTING_ENABLED:'true',V1_PAID_TESTING_ENABLED:'true',OPENAI_API_KEY:'fictional',DEEPGRAM_API_KEY:'fictional',LIVE_CALL_TEST_SESSION_LIMIT:'20',LIVE_CALL_MAX_CONNECTIONS:'2',LIVE_CALL_MAX_DETECTIONS:'20',LIVE_CALL_MAX_ANSWERS:'4',LIVE_CALL_RESERVE_PAISE:'50000'};
async function enabled(run:()=>Promise<void>){const old={...process.env};Object.assign(process.env,config);try{await run();}finally{for(const k of Object.keys(config))if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}}
function setup(){const f=workspaceFixture();f.table('spendingMonths').set('ledger',{_id:'ledger',month:new Date().toISOString().slice(0,7),reservedPaise:344800,reservations:17});return f;}
test('three approved test calls reserve ₹784 each and search/shortening draw from that money once',async()=>enabled(async()=>{
 const f=setup();
 for(let n=0;n<3;n++){
  const call=await start._handler(f.ctx,{mode:'generic'});const before=344800+(n+1)*78400;assert.equal(call.budgetAlert,n>=2);
  assert.equal(f.table('spendingMonths').get('ledger').reservedPaise,before);
  const pool=[...f.table('callAnswerBudgets').values()].find(r=>r.sessionId===call.sessionId);assert.equal(pool.remainingPaise,28400);
  const search={key:`public-search-${n}`,purpose:'opening' as const,amountPaise:5000,sessionId:call.sessionId};
  await reserve._handler(f.ctx,search);await reserve._handler(f.ctx,search);
  await reserve._handler(f.ctx,{...search,key:`answer-repair-${n}`,amountPaise:2100});
  assert.equal(pool.remainingPaise,21300);assert.equal(f.table('spendingMonths').get('ledger').reservedPaise,before);
  await change._handler(f.ctx,{sessionId:call.sessionId,state:'stopped'});
 }
 assert.equal(f.table('spendingMonths').get('ledger').reservedPaise,580000);
 assert.equal(allocationLimit()-580000,64800);assert.equal(monthlyBudget(),800000);
}));
test('insufficient combined funding refuses Start without creating a call or spending record',async()=>enabled(async()=>{
 const f=setup();f.table('spendingMonths').get('ledger').reservedPaise=644800-78399;
 await assert.rejects(()=>start._handler(f.ctx,{mode:'generic'}),/budget has been exhausted/);
 assert.equal(f.table('liveCalls').size,0);assert.equal(f.table('callAnswerBudgets').size,0);assert.equal(f.table('spendingReservations').size,0);
}));
test('additional shortening reserves only the amount beyond the pool; denial leaves the pool intact',async()=>enabled(async()=>{
 const f=setup(),call=await start._handler(f.ctx,{mode:'generic'}),pool=[...f.table('callAnswerBudgets').values()][0];pool.remainingPaise=1000;
 const before=f.table('spendingMonths').get('ledger').reservedPaise;
 await reserve._handler(f.ctx,{key:'extra-repair',purpose:'opening',amountPaise:2100,sessionId:call.sessionId});
 assert.equal(pool.remainingPaise,0);assert.equal(f.table('spendingMonths').get('ledger').reservedPaise,before+1100);
 pool.remainingPaise=1000;f.table('spendingMonths').get('ledger').reservedPaise=644800;
 const result=await reserve._handler(f.ctx,{key:'denied-repair',purpose:'opening',amountPaise:2100,sessionId:call.sessionId});assert.equal(result.status,'exhausted');assert.equal(pool.remainingPaise,1000);
}));
test('pool funds cannot cross sessions, survive key reuse with a different scope, or pay for stopped/paused calls',async()=>enabled(async()=>{
 const f=setup(),call=await start._handler(f.ctx,{mode:'generic'});
 const args={key:'scoped-repair',purpose:'opening' as const,amountPaise:2100,sessionId:call.sessionId};await reserve._handler(f.ctx,args);
 await assert.rejects(()=>reserve._handler(f.ctx,{...args,sessionId:undefined}),/cannot be reused/);
 f.table('liveCalls').get(call.sessionId).state='paused';await assert.rejects(()=>reserve._handler(f.ctx,{...args,key:'paused-repair'}),/stopped or expired/);
 await change._handler(f.ctx,{sessionId:call.sessionId,state:'stopped'});await assert.rejects(()=>reserve._handler(f.ctx,{...args,key:'stopped-repair'}),/stopped or expired/);
 assert.equal([...f.table('callAnswerBudgets').values()][0].remainingPaise,26300);
}));
test('October increase is development-only, month-limited, and never changes production trial funding',()=>{
 const dev={...config},prod={...config,CONVEX_CLOUD_URL:'https://deafening-frog-846.convex.cloud'};
 assert.equal(allocationLimit(dev),644800);assert.equal(monthlyBudget(dev),800000);assert.equal(monthlyBudget(prod),500000);
 assert.equal(allocationLimit({...dev,CUELO_OCTOBER_FLOW_TESTS:'wrong'}),150000);
});

test('pool allocation survives Pause/Resume without a second hold and closed-call money is not automatically released',async()=>enabled(async()=>{
 const f=setup(),call=await start._handler(f.ctx,{mode:'generic'}),before=f.table('spendingMonths').get('ledger').reservedPaise;
 await change._handler(f.ctx,{sessionId:call.sessionId,state:'paused'});await change._handler(f.ctx,{sessionId:call.sessionId,state:'active'});
 assert.equal(f.table('spendingMonths').get('ledger').reservedPaise,before);assert.equal(f.table('callAnswerBudgets').size,1);
 await reserve._handler(f.ctx,{key:'resumed-search',purpose:'opening',amountPaise:5000,sessionId:call.sessionId});assert.equal(f.table('spendingMonths').get('ledger').reservedPaise,before);
 await change._handler(f.ctx,{sessionId:call.sessionId,state:'stopped'});assert.equal(f.table('spendingMonths').get('ledger').reservedPaise,before);assert.equal(f.table('callAnswerBudgets').size,1);
}));
test('legacy calls without a pool still reserve each operation and website requests cannot use a call pool',async()=>enabled(async()=>{
 const f=setup(),call=await start._handler(f.ctx,{mode:'generic'}),before=f.table('spendingMonths').get('ledger').reservedPaise;
 await reserve._handler(f.ctx,{key:'website-search',purpose:'opening',amountPaise:5000});assert.equal(f.table('spendingMonths').get('ledger').reservedPaise,before+5000);assert.equal([...f.table('callAnswerBudgets').values()][0].remainingPaise,28400);
 f.table('callAnswerBudgets').clear();await reserve._handler(f.ctx,{key:'legacy-search',purpose:'opening',amountPaise:5000,sessionId:call.sessionId});assert.equal(f.table('spendingMonths').get('ledger').reservedPaise,before+10000);
}));
test('malformed or previous-month pool data cannot bypass the spending ledger',async()=>enabled(async()=>{
 const f=setup(),call=await start._handler(f.ctx,{mode:'generic'}),pool=[...f.table('callAnswerBudgets').values()][0];const args={key:'malformed-search',purpose:'opening' as const,amountPaise:5000,sessionId:call.sessionId};
 pool.remainingPaise=-1;await assert.rejects(()=>reserve._handler(f.ctx,args),/Invalid call answer budget/);pool.remainingPaise=28400;pool.month='2026-09';await assert.rejects(()=>reserve._handler(f.ctx,args),/monthly budget period/);assert.equal(f.table('spendingReservations').size,1);
}));
