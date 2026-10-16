// Narrow, explicitly approved October review. No provider requests or usage resets.
import {v} from 'convex/values';
import {internalMutation,internalQuery,type QueryCtx} from './_generated/server';
import {spendingMonth} from './spendingPolicy';
const reviewKey='2026-10-15-approved-split';
const args={month:v.literal('2026-10'),confirmedThrough:v.number(),openAiUsdMicros:v.literal(130000),deepgramUsdMicros:v.literal(241940),retainedPaise:v.literal(50000),callsStoppedConfirmed:v.literal(true)};
const result=v.object({beforePaise:v.number(),releasePaise:v.number(),afterPaise:v.number(),alreadyApplied:v.boolean()});
type Args={month:'2026-10';confirmedThrough:number;openAiUsdMicros:number;deepgramUsdMicros:number;retainedPaise:number;callsStoppedConfirmed:true};
async function preview(ctx:QueryCtx,a:Args,key=reviewKey){
 if(key!==reviewKey&&process.env.CONVEX_CLOUD_URL!=='https://calculating-gecko-263.convex.cloud')throw Error('Follow-up is development only.');
 if(!['https://calculating-gecko-263.convex.cloud','https://deafening-frog-846.convex.cloud'].includes(process.env.CONVEX_CLOUD_URL??''))throw Error('Unapproved deployment.');
 if(process.env.LIVE_CALL_TESTING_ENABLED==='true')throw Error('Turn listening off before reviewing reservations.');
 if(!Number.isSafeInteger(a.confirmedThrough)||a.confirmedThrough>Date.now()||spendingMonth(a.confirmedThrough)!==a.month)throw Error('Invalid report cutoff.');
 const audits=await ctx.db.query('spendingReconciliations').withIndex('by_month',q=>q.eq('month',a.month)).take(101);if(audits.length>100)throw Error('Review history exceeds this bounded review.');
 const prior=audits.find(x=>x.reviewKey===key);
 if(prior){if(prior.confirmedThrough!==a.confirmedThrough)throw Error('This review was already applied with a different cutoff.');return {ledger:null,ids:[],view:{beforePaise:prior.beforePaise,releasePaise:prior.releasePaise,afterPaise:prior.afterPaise,alreadyApplied:true}};}
 const ledger=(await ctx.db.query('spendingMonths').withIndex('by_month',q=>q.eq('month',a.month)).take(1))[0];if(!ledger)throw Error('Missing monthly ledger.');
 const rows=await ctx.db.query('spendingReservations').withIndex('by_month_purpose',q=>q.eq('month',a.month).eq('purpose','live')).take(101);if(rows.length>100)throw Error('Too many reservations for this review.');
 const closed=[];for(const row of rows){if(row._creationTime>a.confirmedThrough||!row.key.startsWith('live-'))continue;const id=ctx.db.normalizeId('liveCalls',row.key.slice(5));if(!id||await ctx.db.get(id))continue;if(!Number.isSafeInteger(row.amountPaise)||row.amountPaise<=0)throw Error('Invalid reservation amount.');closed.push(row);}
 const ids=closed.map(x=>x._id),eligible=new Set(ids);
 for(const audit of audits)if(audit.reservationIds.some(id=>!eligible.has(id)))throw Error('Earlier reviewed reservations are not all closed and covered by this report.');
 const remaining=closed.reduce((sum,x)=>sum+x.amountPaise,0)-audits.reduce((sum,x)=>sum+x.releasePaise,0);
 const protectedPaise=ledger.reservedPaise-remaining,releasePaise=ledger.reservedPaise-a.retainedPaise;
 if(!Number.isSafeInteger(remaining)||remaining<0||!Number.isSafeInteger(protectedPaise)||protectedPaise<0)throw Error('Ledger totals do not match immutable reservations and previous reviews.');
 if(releasePaise<=0||releasePaise>remaining||a.retainedPaise-protectedPaise<10000)throw Error('Cannot retain the approved hold while protecting other reservations.');
 return {ledger,ids,view:{beforePaise:ledger.reservedPaise,releasePaise,afterPaise:a.retainedPaise,alreadyApplied:false}};
}
export const previewOctober=internalQuery({args,returns:result,handler:async(ctx,a)=>(await preview(ctx,a)).view});
export const applyOctober=internalMutation({args:{...args,expectedBeforePaise:v.number(),expectedReleasePaise:v.number()},returns:result,handler:async(ctx,a)=>{
 const p=await preview(ctx,a);if(p.view.beforePaise!==a.expectedBeforePaise||p.view.releasePaise!==a.expectedReleasePaise)throw Error('Ledger changed; preview again.');if(p.view.alreadyApplied)return p.view;
 await ctx.db.insert('spendingReconciliations',{reviewKey,month:a.month,confirmedThrough:a.confirmedThrough,openAiUsdMicros:a.openAiUsdMicros,deepgramUsdMicros:a.deepgramUsdMicros,retainedPaise:a.retainedPaise,beforePaise:p.view.beforePaise,releasePaise:p.view.releasePaise,afterPaise:p.view.afterPaise,reservationIds:p.ids,createdAt:Date.now()});
 await ctx.db.patch(p.ledger!._id,{reservedPaise:p.view.afterPaise});return p.view;
}});

const retestKey='2026-10-15-one-development-retest';
const retestArgs={month:v.literal('2026-10'),confirmedThrough:v.number(),openAiUsdMicros:v.literal(140000),deepgramUsdMicros:v.literal(275780),retainedPaise:v.literal(100000),callsStoppedConfirmed:v.literal(true)};
export const previewDevelopmentRetest=internalQuery({args:retestArgs,returns:result,handler:async(ctx,a)=>(await preview(ctx,a,retestKey)).view});
export const applyDevelopmentRetest=internalMutation({args:{...retestArgs,expectedBeforePaise:v.literal(150000),expectedReleasePaise:v.literal(50000)},returns:result,handler:async(ctx,a)=>{
 const p=await preview(ctx,a,retestKey);if(p.view.beforePaise!==a.expectedBeforePaise||p.view.releasePaise!==a.expectedReleasePaise)throw Error('Ledger changed; preview again.');if(p.view.alreadyApplied)return p.view;
 await ctx.db.insert('spendingReconciliations',{reviewKey:retestKey,month:a.month,confirmedThrough:a.confirmedThrough,openAiUsdMicros:a.openAiUsdMicros,deepgramUsdMicros:a.deepgramUsdMicros,retainedPaise:a.retainedPaise,beforePaise:p.view.beforePaise,releasePaise:p.view.releasePaise,afterPaise:p.view.afterPaise,reservationIds:p.ids,createdAt:Date.now()});
 await ctx.db.patch(p.ledger!._id,{reservedPaise:p.view.afterPaise});return p.view;
}});
