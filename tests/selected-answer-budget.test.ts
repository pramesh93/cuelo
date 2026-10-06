import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {admit,cancel,finish,cancelled,status} from '../convex/selectedAnswerBudget';
function fixture(){let serial=0;const tables=new Map<string,Map<string,any>>();const table=(name:string)=>{if(!tables.has(name))tables.set(name,new Map());return tables.get(name)!;};
const ctx={auth:{getUserIdentity:async()=>null},db:{query:(name:string)=>({withIndex:(_index:string,select:any)=>{let field='',value:any;const q={eq:(f:string,v:any)=>{field=f;value=v;return q;}};select(q);return {take:async(n:number)=>[...table(name).values()].filter(r=>r[field]===value).slice(0,n)};}}),insert:async(name:string,row:any)=>{const id=`${name}-${++serial}`;table(name).set(id,{_id:id,...row});return id;},patch:async(id:string,values:any)=>{for(const t of tables.values())if(t.has(id))Object.assign(t.get(id),values);},delete:async(id:string)=>{for(const t of tables.values())t.delete(id);}}};return {ctx:ctx as any,table};}
const secret='a'.repeat(64);
test('disabled/exhausted budgets write nothing; paid attempts share the original global cap',async()=>{
 const prior={paid:process.env.V1_PAID_TESTING_ENABLED,test:process.env.EVALUATION_TESTING_ENABLED,limit:process.env.EVALUATION_ATTEMPT_LIMIT};
 try {delete process.env.V1_PAID_TESTING_ENABLED;process.env.EVALUATION_TESTING_ENABLED='true';process.env.EVALUATION_ATTEMPT_LIMIT='10';const f=fixture();
 await assert.rejects(()=>admit._handler(f.ctx,{visitSecret:secret,requestKey:randomUUID()}),/not enabled/);assert.equal(f.table('evaluationUsage').size,0);
 process.env.V1_PAID_TESTING_ENABLED='true';f.table('evaluationUsage').set('usage',{_id:'usage',scope:'milestone1',count:9,reservedUsd:.9});const requestKey=randomUUID();await admit._handler(f.ctx,{visitSecret:secret,requestKey});assert.equal(f.table('evaluationUsage').get('usage').count,10);assert.equal(f.table('spendingReservations').size,1);
 await assert.rejects(()=>admit._handler(f.ctx,{visitSecret:secret,requestKey:randomUUID()}),/allowance/);assert.equal(f.table('spendingReservations').size,1);
 await finish._handler(f.ctx,{visitSecret:secret,requestKey,successful:false});assert.equal([...f.table('answerVisits').values()][0].successful,0);
 await assert.rejects(()=>admit._handler(f.ctx,{visitSecret:secret,requestKey}),/already used/);
 }finally{for(const [key,value] of [['V1_PAID_TESTING_ENABLED',prior.paid],['EVALUATION_TESTING_ENABLED',prior.test],['EVALUATION_ATTEMPT_LIMIT',prior.limit]])if(value===undefined)delete process.env[key!];else process.env[key!]=value;}
});
test('a new question cancels an old request and only five current successful answers consume the visit allowance',async()=>{
 const prior={paid:process.env.V1_PAID_TESTING_ENABLED,test:process.env.EVALUATION_TESTING_ENABLED};
 try{process.env.V1_PAID_TESTING_ENABLED='true';process.env.EVALUATION_TESTING_ENABLED='true';const f=fixture();const old=randomUUID(),next=randomUUID();
 await admit._handler(f.ctx,{visitSecret:secret,requestKey:old});await admit._handler(f.ctx,{visitSecret:secret,requestKey:next});assert.equal(await cancelled._handler(f.ctx,{visitSecret:secret,requestKey:old}),true);assert.equal(await finish._handler(f.ctx,{visitSecret:secret,requestKey:old,successful:true}),false);assert.equal(await finish._handler(f.ctx,{visitSecret:secret,requestKey:next,successful:true}),true);
 for(let i=0;i<4;i++){const requestKey=randomUUID();await admit._handler(f.ctx,{visitSecret:secret,requestKey});await finish._handler(f.ctx,{visitSecret:secret,requestKey,successful:true});}
 await assert.rejects(()=>admit._handler(f.ctx,{visitSecret:secret,requestKey:randomUUID()}),/five free/);assert.equal((await status._handler(f.ctx,{visitSecret:secret})).remaining,0);
 const before=randomUUID();await cancel._handler(f.ctx,{visitSecret:secret,requestKey:before});await assert.rejects(()=>admit._handler(f.ctx,{visitSecret:secret,requestKey:before}),/cancelled/);
 }finally{if(prior.paid===undefined)delete process.env.V1_PAID_TESTING_ENABLED;else process.env.V1_PAID_TESTING_ENABLED=prior.paid;if(prior.test===undefined)delete process.env.EVALUATION_TESTING_ENABLED;else process.env.EVALUATION_TESTING_ENABLED=prior.test;}
});
