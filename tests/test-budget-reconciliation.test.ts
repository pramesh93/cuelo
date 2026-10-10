import {test} from 'node:test';import assert from 'node:assert/strict';
import {previewTestReconciliation,applyTestReconciliation} from '../convex/spending';
function fixture(){
 const month='2026-10',ledger={_id:'ledger',month,reservedPaise:408000,reservations:9};
 const reservations=Array.from({length:8},(_,i)=>({_id:`reservation-${i}`,key:`live-call-${i}`,month,purpose:'live',amountPaise:50000,_creationTime:Date.UTC(2026,9,1)+1000}));
 const active=new Map<string,any>(),audits:any[]=[];
 const db:any={query:(table:string)=>({withIndex:(_index:string,select:any)=>{const where:Record<string,unknown>={};const q={eq:(k:string,v:unknown)=>{where[k]=v;return q;}};select(q);return {take:async(n:number)=>{const rows=table==='spendingMonths'?[ledger]:table==='spendingReconciliations'?audits:reservations;return rows.filter(r=>Object.entries(where).every(([k,v])=>(r as any)[k]===v)).slice(0,n);}}}}),normalizeId:(_table:string,id:string)=>id.startsWith('call-')?id:null,get:async(id:string)=>active.get(id)??null,patch:async(id:string,values:any)=>{assert.equal(id,'ledger');Object.assign(ledger,values);},insert:async(table:string,row:any)=>{assert.equal(table,'spendingReconciliations');audits.push({_id:'audit',...row});return 'audit';}};
 return {ctx:{db} as any,ledger,reservations,active,audits};
}
const args={month:'2026-10',confirmedThrough:Date.UTC(2026,9,1)+2000,retainedPaise:10000,openAiUsdMicros:110000,deepgramUsdMicros:148320,callsStoppedConfirmed:true as const};
async function dev(run:()=>Promise<void>){const previous=process.env.CONVEX_CLOUD_URL;process.env.CONVEX_CLOUD_URL='https://calculating-gecko-263.convex.cloud';try{await run();}finally{if(previous===undefined)delete process.env.CONVEX_CLOUD_URL;else process.env.CONVEX_CLOUD_URL=previous;}}
test('preview releases nothing; confirmed reconciliation preserves other holds, original reservations and the budget',async()=>{await dev(async()=>{
 const f=fixture();const preview=await previewTestReconciliation._handler(f.ctx,args);assert.equal(preview.releasePaise,390000);assert.equal(preview.afterPaise,18000);assert.equal(f.ledger.reservedPaise,408000);assert.equal(f.audits.length,0);
 await applyTestReconciliation._handler(f.ctx,{...args,expectedBeforePaise:408000,expectedReleasePaise:390000});assert.equal(f.ledger.reservedPaise,18000);assert.equal(f.reservations[0].amountPaise,50000);assert.equal(f.ledger.reservations,9);assert.equal(f.audits.length,1);
 await applyTestReconciliation._handler(f.ctx,{...args,expectedBeforePaise:408000,expectedReleasePaise:390000});assert.equal(f.ledger.reservedPaise,18000);assert.equal(f.audits.length,1);
 });});
test('active/unverified calls and calls after the report cutoff keep their full reservations',async()=>{await dev(async()=>{
 const f=fixture();f.active.set('call-0',{state:'paused'});f.reservations[1]._creationTime=Date.UTC(2026,9,1)+3000;f.reservations[2].key='unverified-reference';
 const preview=await previewTestReconciliation._handler(f.ctx,args);assert.equal(preview.closedCalls,5);assert.equal(preview.releasePaise,240000);assert.equal(preview.afterPaise,168000);
 });});
test('production and stale approval cannot change the ledger; a month cannot be reconciled twice',async()=>{await dev(async()=>{
 const f=fixture();await assert.rejects(()=>applyTestReconciliation._handler(f.ctx,{...args,expectedBeforePaise:400000,expectedReleasePaise:390000}),/changed/);assert.equal(f.audits.length,0);
 process.env.CONVEX_CLOUD_URL='https://deafening-frog-846.convex.cloud';await assert.rejects(()=>previewTestReconciliation._handler(f.ctx,args),/test deployment/);process.env.CONVEX_CLOUD_URL='https://calculating-gecko-263.convex.cloud';
 await applyTestReconciliation._handler(f.ctx,{...args,expectedBeforePaise:408000,expectedReleasePaise:390000});await assert.rejects(()=>applyTestReconciliation._handler(f.ctx,{...args,retainedPaise:20000,expectedBeforePaise:408000,expectedReleasePaise:390000}),/already/);
 });});

test('reconciliation tools are internal and reject insufficient retained funds or reports outside this review',async()=>{await dev(async()=>{
 assert.equal(previewTestReconciliation.isInternal,true);assert.equal(applyTestReconciliation.isInternal,true);const f=fixture();
 for(const change of [{retainedPaise:0},{retainedPaise:9999},{openAiUsdMicros:1000001},{deepgramUsdMicros:-1},{retainedPaise:10000.1},{confirmedThrough:Date.now()+3600000}])await assert.rejects(()=>previewTestReconciliation._handler(f.ctx,{...args,...change}));
 assert.equal(f.ledger.reservedPaise,408000);assert.equal(f.audits.length,0);
});});
test('too many rows or a mismatched monthly ledger stop reconciliation without writes',async()=>{await dev(async()=>{
 const f=fixture();f.ledger.reservedPaise=1000;await assert.rejects(()=>previewTestReconciliation._handler(f.ctx,args),/totals/);assert.equal(f.audits.length,0);
 const g=fixture();for(let i=8;i<101;i++)g.reservations.push({...g.reservations[0],_id:`reservation-${i}`,key:`live-call-${i}`});await assert.rejects(()=>previewTestReconciliation._handler(g.ctx,args),/Too many/);assert.equal(g.audits.length,0);
});});
